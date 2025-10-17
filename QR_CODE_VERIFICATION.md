# QR Code Verification

This document verifies the URLs encoded in museum QR codes.

## Purpose
QR codes should link to museum-checkin.html with ONLY the museum parameter, NOT including the age parameter. This allows users to select their appropriate age group after scanning, providing a better user experience.

## Regenerated QR Codes

### Zhaoyuan Hengli Clock Museum (招远恒利钟表博物馆)
- **File**: `MuseumCheck_QRCode_ZhaoyuanHengliWatchMuseum.png`
- **URL**: `https://museumcheck.cn/museum-checkin.html?museum=zhaoyuan-hengli-watch-museum`
- **Parameters**: 
  - ✓ `museum=zhaoyuan-hengli-watch-museum`
  - ✗ NO `age` parameter (correct!)
- **Status**: ✓ Fixed (removed age parameter)

### Forbidden City (故宫博物院)
- **File**: `MuseumCheck_QRCode_ForbiddenCity.png`
- **URL**: `https://museumcheck.cn/museum-checkin.html?museum=forbidden-city`
- **Parameters**:
  - ✓ `museum=forbidden-city`
  - ✗ NO `age` parameter (correct!)
- **Status**: ✓ Regenerated for consistency

## How to Verify

### Method 1: Use a QR Code Scanner
1. Open a QR code scanner app on your phone
2. Scan the QR code image
3. Verify the URL shown does NOT contain `&age=` or `?age=`
4. The URL should be: `https://museumcheck.cn/museum-checkin.html?museum=<museum-id>`

### Method 2: Use Online QR Code Decoder
1. Visit an online QR code decoder (e.g., https://zxing.org/w/decode)
2. Upload the QR code PNG file
3. Check the decoded URL
4. Verify it matches the expected URL without age parameter

## Expected Behavior

When users scan these QR codes:
1. They are directed to `museum-checkin.html` for the specific museum
2. The page uses the default age group (7-12岁) initially
3. Users can change the age group using the page's age selector if needed
4. This provides flexibility and better user experience

## Reference

According to `MUSEUM_CHECKIN_DOC.md`:
> Generate QR code linking to: `https://museumcheck.cn/museum-checkin.html?museum=YOUR_MUSEUM_ID`

The age parameter has a default value of `7-12`, so omitting it from QR codes is intentional and correct.

## Test Coverage

Comprehensive tests in `tests/qr-code-urls.test.js` verify:
- ✓ QR code URLs do not include age parameter
- ✓ QR code generation tool creates correct URLs
- ✓ Documentation specifies correct format
- ✓ QR code files exist and are valid PNG images
- ✓ Fireworks wall integration is correct

All tests pass successfully.
