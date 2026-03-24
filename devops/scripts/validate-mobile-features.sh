#!/bin/bash
# Validate v2 and v3 mobile features without browser automation

set -e

echo "🔍 Validating Pinghu Museum Mobile Features"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server is running
if ! curl -s http://localhost:8000 > /dev/null; then
    echo -e "${RED}✗ HTTP server not running on port 8000${NC}"
    exit 1
fi
echo -e "${GREEN}✓ HTTP server is running${NC}"
echo ""

# Test v2 (museum-checkin.html)
echo "📱 Testing v2 (museum-checkin.html)..."
echo "--------------------------------------"

V2_URL="http://localhost:8000/museum-checkin.html?museum=pinghu-museum&age=7-12"
V2_HTML=$(curl -s "$V2_URL")

# Check photo section exists
if echo "$V2_HTML" | grep -q 'id="photoSection"'; then
    echo -e "${GREEN}✓ Photo section exists in v2${NC}"
else
    echo -e "${RED}✗ Photo section missing in v2${NC}"
    exit 1
fi

# Check photo input
if echo "$V2_HTML" | grep -q 'id="taskPhotoInput"'; then
    echo -e "${GREEN}✓ Photo input exists in v2${NC}"
else
    echo -e "${RED}✗ Photo input missing in v2${NC}"
    exit 1
fi

# Check photo button
if echo "$V2_HTML" | grep -q 'id="takePhotoButton"'; then
    echo -e "${GREEN}✓ Photo button exists in v2${NC}"
else
    echo -e "${RED}✗ Photo button missing in v2${NC}"
    exit 1
fi

# Check poster canvas
if echo "$V2_HTML" | grep -q 'id="posterCanvas"'; then
    echo -e "${GREEN}✓ Poster canvas exists in v2${NC}"
else
    echo -e "${RED}✗ Poster canvas missing in v2${NC}"
    exit 1
fi

# Check completion celebration
if echo "$V2_HTML" | grep -q 'id="completionCelebration"'; then
    echo -e "${GREEN}✓ Completion celebration exists in v2${NC}"
else
    echo -e "${RED}✗ Completion celebration missing in v2${NC}"
    exit 1
fi

# Check save poster button
if echo "$V2_HTML" | grep -q 'id="savePosterButton"'; then
    echo -e "${GREEN}✓ Save poster button exists in v2${NC}"
else
    echo -e "${RED}✗ Save poster button missing in v2${NC}"
    exit 1
fi

# Check share poster button
if echo "$V2_HTML" | grep -q 'id="sharePosterButton"'; then
    echo -e "${GREEN}✓ Share poster button exists in v2${NC}"
else
    echo -e "${RED}✗ Share poster button missing in v2${NC}"
    exit 1
fi

# Check photo functions exist
if echo "$V2_HTML" | grep -q 'function handlePhotoCapture'; then
    echo -e "${GREEN}✓ Photo capture function exists in v2${NC}"
else
    echo -e "${RED}✗ Photo capture function missing in v2${NC}"
    exit 1
fi

if echo "$V2_HTML" | grep -q 'function generatePoster'; then
    echo -e "${GREEN}✓ Generate poster function exists in v2${NC}"
else
    echo -e "${RED}✗ Generate poster function missing in v2${NC}"
    exit 1
fi

# Check photo compression
if echo "$V2_HTML" | grep -q 'function compressPhoto'; then
    echo -e "${GREEN}✓ Photo compression function exists in v2${NC}"
else
    echo -e "${RED}✗ Photo compression function missing in v2${NC}"
    exit 1
fi

echo ""

# Test v3 (single-museum.html)
echo "📱 Testing v3 (single-museum.html)..."
echo "--------------------------------------"

V3_URL="http://localhost:8000/single-museum.html?museum=pinghu-museum"
V3_HTML=$(curl -s "$V3_URL")

# Check share step exists
if echo "$V3_HTML" | grep -q 'id="step-share"'; then
    echo -e "${GREEN}✓ Share step exists in v3${NC}"
else
    echo -e "${RED}✗ Share step missing in v3${NC}"
    exit 1
fi

# Check poster canvas
if echo "$V3_HTML" | grep -q 'id="posterCanvas"'; then
    echo -e "${GREEN}✓ Poster canvas exists in v3${NC}"
else
    echo -e "${RED}✗ Poster canvas missing in v3${NC}"
    exit 1
fi

# Check poster preview
if echo "$V3_HTML" | grep -q 'id="posterPreview"'; then
    echo -e "${GREEN}✓ Poster preview exists in v3${NC}"
else
    echo -e "${RED}✗ Poster preview missing in v3${NC}"
    exit 1
fi

# Check save poster button
if echo "$V3_HTML" | grep -q 'id="savePoster"'; then
    echo -e "${GREEN}✓ Save poster button exists in v3${NC}"
else
    echo -e "${RED}✗ Save poster button missing in v3${NC}"
    exit 1
fi

# Check share poster button
if echo "$V3_HTML" | grep -q 'id="sharePoster"'; then
    echo -e "${GREEN}✓ Share poster button exists in v3${NC}"
else
    echo -e "${RED}✗ Share poster button missing in v3${NC}"
    exit 1
fi

# Check that poster is generated on share step
V3_JS=$(curl -s "http://localhost:8000/single-museum.js")
if echo "$V3_JS" | grep -q "if(step === 'share')"; then
    if echo "$V3_JS" | grep -A 2 "if(step === 'share')" | grep -q "generatePoster"; then
        echo -e "${GREEN}✓ Poster generation triggers on share step in v3${NC}"
    else
        echo -e "${RED}✗ Poster generation not triggered on share step in v3${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Share step check missing in v3${NC}"
    exit 1
fi

echo ""

# Test mobile responsiveness
echo "📱 Testing Mobile Responsiveness..."
echo "-----------------------------------"

# Check v2 mobile styles
if echo "$V2_HTML" | grep -q '@media (max-width: 768px)'; then
    echo -e "${GREEN}✓ Mobile breakpoints exist in v2${NC}"
else
    echo -e "${RED}✗ Mobile breakpoints missing in v2${NC}"
    exit 1
fi

# Check v3 mobile styles
if echo "$V3_HTML" | grep -q 'viewport.*width=device-width'; then
    echo -e "${GREEN}✓ Viewport meta tag exists in v3${NC}"
else
    echo -e "${RED}✗ Viewport meta tag missing in v3${NC}"
    exit 1
fi

echo ""

# Test Pinghu Museum data
echo "📱 Testing Pinghu Museum Data..."
echo "--------------------------------"

PINGHU_DATA=$(curl -s "http://localhost:8000/museums/pinghu-museum.js")

# Expected number of tasks for Pinghu Museum
EXPECTED_TASK_COUNT=5

# Check museum ID
if echo "$PINGHU_DATA" | grep -q "id: 'pinghu-museum'"; then
    echo -e "${GREEN}✓ Pinghu museum ID correct${NC}"
else
    echo -e "${RED}✗ Pinghu museum ID incorrect${NC}"
    exit 1
fi

# Check collections exist
if echo "$PINGHU_DATA" | grep -q "collections:"; then
    echo -e "${GREEN}✓ Pinghu museum collections exist${NC}"
else
    echo -e "${RED}✗ Pinghu museum collections missing${NC}"
    exit 1
fi

# Check workflows exist
if echo "$PINGHU_DATA" | grep -q "workflows:"; then
    echo -e "${GREEN}✓ Pinghu museum workflows exist${NC}"
else
    echo -e "${RED}✗ Pinghu museum workflows missing${NC}"
    exit 1
fi

# Count tasks (should be 5: gate + 3 treasures + victory)
# Check for visit array which contains all tasks
# Use -A 50 to accommodate larger task arrays in the future
VISIT_TASKS=$(echo "$PINGHU_DATA" | grep -A 50 "visit:" | grep -c "id:" || true)
if [ "$VISIT_TASKS" -ge "$EXPECTED_TASK_COUNT" ]; then
    echo -e "${GREEN}✓ Pinghu museum has correct number of tasks in visit array ($VISIT_TASKS)${NC}"
else
    echo -e "${RED}✗ Pinghu museum has incorrect number of tasks ($VISIT_TASKS, expected ≥$EXPECTED_TASK_COUNT)${NC}"
    exit 1
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ All validations passed!${NC}"
echo ""
echo "📊 Summary:"
echo "  - v2 (museum-checkin.html): Photo capture ✓"
echo "  - v2: Poster generation ✓"
echo "  - v2: Download & share buttons ✓"
echo "  - v3 (single-museum.html): Poster as final step ✓"
echo "  - v3: Share functionality ✓"
echo "  - Mobile responsiveness: ✓"
echo "  - Pinghu Museum data: ✓"
echo ""
echo "🎉 Ready for mobile testing!"
