#!/bin/bash

# Database Initialization Script using curl + letmetry.cloud MySQL query API
# This script creates the achievement_posters table if it doesn't exist
# and adds missing columns if the table exists but lacks required columns

set -e

LETMETRY_API="https://letmetry.cloud"

echo "🔧 Initializing achievement_posters table using curl..."
echo ""

# Step 1: Check if table exists
echo "Step 1: Checking if table exists..."
CHECK_RESPONSE=$(curl -s -X POST "${LETMETRY_API}/mysql/query" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SHOW TABLES LIKE '\''achievement_posters'\''"}')

echo "Response: $CHECK_RESPONSE"

# Check if table exists (response will be empty array [] if table doesn't exist)
if echo "$CHECK_RESPONSE" | grep -q "achievement_posters"; then
  echo "✅ Table achievement_posters already exists."
  echo ""
  
  # Verify table structure and add missing columns
  echo "Step 2: Verifying table structure..."
  DESCRIBE_RESPONSE=$(curl -s -X POST "${LETMETRY_API}/mysql/query" \
    -H "Content-Type: application/json" \
    -d '{"sql": "DESCRIBE achievement_posters"}')
  
  echo "Current table structure:"
  echo "$DESCRIBE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DESCRIBE_RESPONSE"
  echo ""
  
  # Check for museum_id column
  if ! echo "$DESCRIBE_RESPONSE" | grep -q '"Field": "museum_id"'; then
    echo "⚠️  Missing museum_id column. Adding..."
    ADD_MUSEUM_ID=$(curl -s -X POST "${LETMETRY_API}/mysql/query" \
      -H "Content-Type: application/json" \
      -d '{"sql": "ALTER TABLE achievement_posters ADD COLUMN museum_id VARCHAR(100) AFTER user_name"}')
    echo "Response: $ADD_MUSEUM_ID"
    echo "✅ Added museum_id column"
    
    # Add index on museum_id
    echo "Adding index on museum_id..."
    ADD_INDEX=$(curl -s -X POST "${LETMETRY_API}/mysql/query" \
      -H "Content-Type: application/json" \
      -d '{"sql": "ALTER TABLE achievement_posters ADD INDEX idx_museum_id (museum_id)"}')
    echo "✅ Added index on museum_id"
  fi
  
  # Check for age_group column
  if ! echo "$DESCRIBE_RESPONSE" | grep -q '"Field": "age_group"'; then
    echo "⚠️  Missing age_group column. Adding..."
    ADD_AGE_GROUP=$(curl -s -X POST "${LETMETRY_API}/mysql/query" \
      -H "Content-Type: application/json" \
      -d '{"sql": "ALTER TABLE achievement_posters ADD COLUMN age_group VARCHAR(20) AFTER museum_id"}')
    echo "Response: $ADD_AGE_GROUP"
    echo "✅ Added age_group column"
  fi
  
  echo ""
  echo "✅ Table structure verified and updated."
  echo ""
  echo "🎉 Database initialization completed successfully!"
  exit 0
fi

# Step 2: Table doesn't exist, create it
echo "ℹ️  Table does not exist. Creating..."
echo ""

CREATE_TABLE_SQL="CREATE TABLE achievement_posters (id INT PRIMARY KEY AUTO_INCREMENT, image_url VARCHAR(500), title VARCHAR(200), user_name VARCHAR(100), museum_id VARCHAR(100), age_group VARCHAR(20), visibility VARCHAR(20) DEFAULT 'public', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX idx_visibility (visibility), INDEX idx_museum_id (museum_id), INDEX idx_created_at (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"

CREATE_RESPONSE=$(curl -s -X POST "${LETMETRY_API}/mysql/query" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$CREATE_TABLE_SQL\"}")

echo "Create table response: $CREATE_RESPONSE"

# Check for errors in response
if echo "$CREATE_RESPONSE" | grep -qi "error"; then
  echo "❌ Error creating table:"
  echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
  exit 1
fi

echo "✅ Table achievement_posters created successfully!"
echo ""

# Step 3: Verify creation
echo "Step 3: Verifying table creation..."
VERIFY_RESPONSE=$(curl -s -X POST "${LETMETRY_API}/mysql/query" \
  -H "Content-Type: application/json" \
  -d '{"sql": "DESCRIBE achievement_posters"}')

echo "Verified table structure:"
echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

echo "🎉 Database initialization completed successfully!"
