#!/usr/bin/env python3
"""
Backend API Testing for Inventory Management System
Tests all endpoints with role-based access control
"""

import requests
import sys
import json
from datetime import datetime

class InventoryAPITester:
    def __init__(self, base_url="https://asset-tracker-pro-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.manager_token = None
        self.stocker_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test manager login
        success, response = self.run_test(
            "Manager Login",
            "POST",
            "auth/login",
            200,
            data={"email": "manager@test.com", "password": "demo123"}
        )
        
        if success and 'token' in response:
            self.manager_token = response['token']
            print(f"   Manager token acquired: {self.manager_token[:20]}...")
            
            # Verify manager role
            if 'user' in response and response['user']['role'] == 'inventory_manager':
                print("   ✅ Manager role verified")
            else:
                print("   ❌ Manager role verification failed")
        else:
            print("   ❌ Manager login failed - cannot continue tests")
            return False
        
        # Test stocker login
        success, response = self.run_test(
            "Stocker Login",
            "POST",
            "auth/login",
            200,
            data={"email": "stocker@test.com", "password": "demo123"}
        )
        
        if success and 'token' in response:
            self.stocker_token = response['token']
            print(f"   Stocker token acquired: {self.stocker_token[:20]}...")
            
            # Verify stocker role
            if 'user' in response and response['user']['role'] == 'stocker':
                print("   ✅ Stocker role verified")
            else:
                print("   ❌ Stocker role verification failed")
        else:
            print("   ❌ Stocker login failed")
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrong"}
        )
        
        # Test auth/me endpoint
        self.run_test(
            "Get Manager Profile",
            "GET",
            "auth/me",
            200,
            token=self.manager_token
        )
        
        return True

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATS")
        print("="*50)
        
        success, response = self.run_test(
            "Dashboard Stats (Manager)",
            "GET",
            "dashboard/stats",
            200,
            token=self.manager_token
        )
        
        if success and response:
            required_fields = ['total_items', 'low_stock_count', 'out_of_stock_count', 'pending_orders', 'total_orders', 'active_vendors']
            for field in required_fields:
                if field in response:
                    print(f"   ✅ {field}: {response[field]}")
                else:
                    print(f"   ❌ Missing field: {field}")
        
        # Test with stocker token
        self.run_test(
            "Dashboard Stats (Stocker)",
            "GET",
            "dashboard/stats",
            200,
            token=self.stocker_token
        )

    def test_inventory_management(self):
        """Test inventory CRUD operations"""
        print("\n" + "="*50)
        print("TESTING INVENTORY MANAGEMENT")
        print("="*50)
        
        # Test get inventory
        success, inventory_data = self.run_test(
            "Get All Inventory",
            "GET",
            "inventory",
            200,
            token=self.manager_token
        )
        
        if success and inventory_data:
            print(f"   ✅ Found {len(inventory_data)} inventory items")
            # Store an item ID for update/delete tests
            if inventory_data:
                test_item_id = inventory_data[0]['id']
                print(f"   Using item ID for tests: {test_item_id}")
        else:
            print("   ❌ No inventory data returned")
            return

        # Test create item (Manager only)
        test_item = {
            "name": "Test Welding Rod",
            "category": "welding",
            "subcategory": "Welding Rods",
            "quantity": 50,
            "available": 50,
            "unit": "pcs",
            "min_threshold": 10
        }
        
        success, created_item = self.run_test(
            "Create Item (Manager)",
            "POST",
            "inventory",
            200,
            data=test_item,
            token=self.manager_token
        )
        
        if success and created_item and 'id' in created_item:
            new_item_id = created_item['id']
            print(f"   ✅ Created item with ID: {new_item_id}")
            
            # Test update item
            update_data = {"quantity": 75, "min_threshold": 15}
            self.run_test(
                "Update Item Quantity",
                "PUT",
                f"inventory/{new_item_id}",
                200,
                data=update_data,
                token=self.manager_token
            )
            
            # Test delete item (Manager only)
            self.run_test(
                "Delete Item (Manager)",
                "DELETE",
                f"inventory/{new_item_id}",
                200,
                token=self.manager_token
            )
        
        # Test create item with stocker (should fail)
        self.run_test(
            "Create Item (Stocker - Should Fail)",
            "POST",
            "inventory",
            403,
            data=test_item,
            token=self.stocker_token
        )
        
        # Test update with stocker (should succeed for quantity updates)
        if inventory_data:
            update_data = {"quantity": 25}
            self.run_test(
                "Update Item (Stocker)",
                "PUT",
                f"inventory/{inventory_data[0]['id']}",
                200,
                data=update_data,
                token=self.stocker_token
            )

    def test_order_management(self):
        """Test order CRUD operations"""
        print("\n" + "="*50)
        print("TESTING ORDER MANAGEMENT")
        print("="*50)
        
        # Get inventory items first
        success, inventory_data = self.run_test(
            "Get Inventory for Orders",
            "GET",
            "inventory",
            200,
            token=self.manager_token
        )
        
        if not success or not inventory_data:
            print("   ❌ Cannot test orders without inventory data")
            return
        
        # Test get orders
        success, orders_data = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200,
            token=self.manager_token
        )
        
        if success:
            print(f"   ✅ Found {len(orders_data) if orders_data else 0} existing orders")
        
        # Test create order
        test_order = {
            "item_id": inventory_data[0]['id'],
            "item_name": inventory_data[0]['name'],
            "category": inventory_data[0]['category'],
            "quantity": 10,
            "notes": "Test order creation"
        }
        
        success, created_order = self.run_test(
            "Create Order (Stocker)",
            "POST",
            "orders",
            200,
            data=test_order,
            token=self.stocker_token
        )
        
        if success and created_order and 'id' in created_order:
            order_id = created_order['id']
            print(f"   ✅ Created order with ID: {order_id}")
            
            # Test approve order (Manager only)
            self.run_test(
                "Approve Order (Manager)",
                "PUT",
                f"orders/{order_id}",
                200,
                data={"status": "approved"},
                token=self.manager_token
            )
            
            # Test mark as delivered (Manager only)
            self.run_test(
                "Mark Order Delivered (Manager)",
                "PUT",
                f"orders/{order_id}",
                200,
                data={"status": "delivered"},
                token=self.manager_token
            )
        
        # Test stocker trying to approve (should fail)
        if success and created_order:
            self.run_test(
                "Approve Order (Stocker - Should Fail)",
                "PUT",
                f"orders/{created_order['id']}",
                403,
                data={"status": "approved"},
                token=self.stocker_token
            )

    def test_vendor_management(self):
        """Test vendor CRUD operations"""
        print("\n" + "="*50)
        print("TESTING VENDOR MANAGEMENT")
        print("="*50)
        
        # Test get vendors
        success, vendors_data = self.run_test(
            "Get All Vendors",
            "GET",
            "vendors",
            200,
            token=self.manager_token
        )
        
        if success:
            print(f"   ✅ Found {len(vendors_data) if vendors_data else 0} existing vendors")
        
        # Test create vendor (Manager only)
        test_vendor = {
            "name": "Test Steel Supplier",
            "contact_person": "John Doe",
            "phone": "+1-555-0123",
            "email": "john@teststeel.com",
            "materials_supplied": ["Steel Rods", "Welding Wire"]
        }
        
        success, created_vendor = self.run_test(
            "Create Vendor (Manager)",
            "POST",
            "vendors",
            200,
            data=test_vendor,
            token=self.manager_token
        )
        
        if success and created_vendor and 'id' in created_vendor:
            vendor_id = created_vendor['id']
            print(f"   ✅ Created vendor with ID: {vendor_id}")
            
            # Test update vendor
            update_data = {
                "phone": "+1-555-9999",
                "status": "active"
            }
            self.run_test(
                "Update Vendor (Manager)",
                "PUT",
                f"vendors/{vendor_id}",
                200,
                data=update_data,
                token=self.manager_token
            )
            
            # Test delete vendor (Manager only)
            self.run_test(
                "Delete Vendor (Manager)",
                "DELETE",
                f"vendors/{vendor_id}",
                200,
                token=self.manager_token
            )
        
        # Test stocker trying to create vendor (should fail)
        self.run_test(
            "Create Vendor (Stocker - Should Fail)",
            "POST",
            "vendors",
            403,
            data=test_vendor,
            token=self.stocker_token
        )
        
        # Test stocker can view vendors
        self.run_test(
            "Get Vendors (Stocker)",
            "GET",
            "vendors",
            200,
            token=self.stocker_token
        )

    def test_unauthorized_access(self):
        """Test endpoints without authentication"""
        print("\n" + "="*50)
        print("TESTING UNAUTHORIZED ACCESS")
        print("="*50)
        
        # Test endpoints without token (should fail)
        endpoints = [
            "inventory",
            "orders", 
            "vendors",
            "dashboard/stats",
            "auth/me"
        ]
        
        for endpoint in endpoints:
            self.run_test(
                f"Unauthorized Access - {endpoint}",
                "GET",
                endpoint,
                401  # Should return 401 Unauthorized
            )

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Inventory Management System Backend Tests")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return 1
        
        # Run all other tests
        self.test_dashboard_stats()
        self.test_inventory_management()
        self.test_order_management()
        self.test_vendor_management()
        self.test_unauthorized_access()
        
        # Print final results
        print("\n" + "="*50)
        print("FINAL RESULTS")
        print("="*50)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("✅ All tests passed! Backend APIs are working correctly.")
            return 0
        else:
            print("❌ Some tests failed. Check the output above for details.")
            return 1

def main():
    tester = InventoryAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())