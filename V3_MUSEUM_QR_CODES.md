# V3 Museum QR Codes Implementation

## Overview
This document describes the implementation of museum-specific QR codes for all V3-supported museums (导览模式) on the fireworks wall page.

## Issue
**为已经支持v3博物馆的加二维码** (Add QR codes for museums that already support v3)
- Generate museum-level check-in QR codes for use on the fireworks page (烟花页面)

## Implementation

### QR Codes Generated
Generated 9 new QR code PNG files for V3 museums (2 already existed: `forbidden-city` and `pinghu-museum`):

1. ✅ **MuseumCheck_QRCode_ForbiddenCity.png** - 故宫博物院 (Already existed)
2. ✅ **MuseumCheck_QRCode_NationalMuseum.png** - 中国国家博物馆 (NEW)
3. ✅ **MuseumCheck_QRCode_PinghuMuseum.png** - 平湖博物馆 (Already existed)
4. ✅ **MuseumCheck_QRCode_BeijingCapitalMuseum.png** - 首都博物馆 (NEW)
5. ✅ **MuseumCheck_QRCode_ChinaArtMuseum.png** - 中国美术馆 (NEW)
6. ✅ **MuseumCheck_QRCode_ChinaMilitaryMuseum.png** - 中国军事博物馆 (NEW)
7. ✅ **MuseumCheck_QRCode_BeijingNaturalHistoryMuseum.png** - 北京自然博物馆 (NEW)
8. ✅ **MuseumCheck_QRCode_ChinaRailwayMuseum.png** - 中国铁道博物馆 (NEW)
9. ✅ **MuseumCheck_QRCode_BeijingPlanetarium.png** - 北京天文馆 (NEW)
10. ✅ **MuseumCheck_QRCode_BeijingArtMuseum.png** - 北京艺术博物馆 (NEW)
11. ✅ **MuseumCheck_QRCode_ChinaScienceTechnologyMuseum.png** - 中国科学技术馆 (NEW)

### QR Code Properties
- **URL Format**: `https://museumcheck.cn/museum-checkin.html?museum={museum-id}`
- **Error Correction**: High (Level H)
- **Size**: 512x512 pixels
- **Format**: PNG
- **File Size**: ~5KB each
- **No Age Parameter**: QR codes do NOT include age parameter, allowing users to select their age group after scanning

### Code Changes

#### 1. fireworks-wall.html
Updated the `museumQrCodes` mapping to include all 11 V3-supported museums:

```javascript
const museumQrCodes = {
    'forbidden-city': 'MuseumCheck_QRCode_ForbiddenCity.png',
    'national-museum': 'MuseumCheck_QRCode_NationalMuseum.png',
    'pinghu-museum': 'MuseumCheck_QRCode_PinghuMuseum.png',
    'beijing-capital-museum': 'MuseumCheck_QRCode_BeijingCapitalMuseum.png',
    'china-art-museum': 'MuseumCheck_QRCode_ChinaArtMuseum.png',
    'china-military-museum': 'MuseumCheck_QRCode_ChinaMilitaryMuseum.png',
    'beijing-natural-history-museum': 'MuseumCheck_QRCode_BeijingNaturalHistoryMuseum.png',
    'china-railway-museum': 'MuseumCheck_QRCode_ChinaRailwayMuseum.png',
    'beijing-planetarium': 'MuseumCheck_QRCode_BeijingPlanetarium.png',
    'beijing-art-museum': 'MuseumCheck_QRCode_BeijingArtMuseum.png',
    'china-science-technology-museum': 'MuseumCheck_QRCode_ChinaScienceTechnologyMuseum.png',
    'zhaoyuan-hengli-watch-museum': 'MuseumCheck_QRCode_ZhaoyuanHengliWatchMuseum.png'
};
```

#### 2. .gitignore
Added temporary generation script to `.gitignore`:
- `generate-v3-qr-codes.js` (one-time use batch generation tool)

## Functionality

### Museum-Specific QR Display
When viewing the fireworks wall with a museum filter (e.g., `?museum=national-museum`):
- QR code changes to museum-specific check-in code
- Alt text updates to: `{museum-name}打卡二维码`
- Label changes to: `扫码打卡` (Scan to check-in)

### Default Behavior
When viewing without a museum filter:
- Shows default WeChat QR code: `MuseumCheck_QRCode_WX.jpg`
- Alt text: `微信小程序二维码`
- Label: `扫码放烟花` (Scan to launch fireworks)

### Fallback Mechanism
If a museum-specific QR code file doesn't exist:
- Automatically falls back to default WeChat QR code
- Uses `onerror` handler to prevent broken images
- Maintains consistent user experience

## Testing

### Unit Tests
All QR-related tests pass:
- ✅ `tests/fireworks-museum-qr.test.js` (7 tests) - Museum-specific QR code logic
- ✅ `tests/fireworks-qr-code.test.js` (14 tests) - General QR code functionality
- ✅ `tests/poster-qr-code.test.js` (7 tests) - Poster QR code tests
- ✅ `tests/qr-code-urls.test.js` (15 tests) - QR URL validation
- **Total**: 43 QR-related tests, all passing

### Manual Verification
Verified the following scenarios:
1. ✅ National Museum QR code displays correctly (`?museum=national-museum`)
2. ✅ Beijing Capital Museum QR code displays correctly (`?museum=beijing-capital-museum`)
3. ✅ Default WeChat QR code shows when no filter specified
4. ✅ Fallback to default QR code works for non-existent museums
5. ✅ All QR code files are accessible via HTTP (200 OK)

### Visual Evidence
Screenshot of fireworks wall with National Museum QR code:
![Fireworks Wall QR Code](https://github.com/user-attachments/assets/df1c8fd4-04cb-428c-bf94-603b7fca6547)

## Tools Used

### QR Code Generation
Used existing tool: `tools/generate-museum-qr.js`
- Utilizes `qrcode` npm package (v1.5.4)
- Supports command-line and programmatic generation
- Outputs high-quality PNG files with consistent naming

### Batch Generation
Created temporary script `generate-v3-qr-codes.js` to batch generate all V3 museum QR codes:
- Checks for existing QR codes to avoid overwriting
- Logs progress for each museum
- Provides summary statistics

## V3 Museum Support

### What is V3?
V3 museums have full single-museum workflow support (导览模式), offering:
- Comprehensive treasure hunt experiences
- Age-appropriate guided tours
- Interactive exploration activities
- Detailed museum-specific content

### Complete V3 Museum List
All 11 V3-supported museums now have dedicated QR codes:
1. forbidden-city (故宫博物院)
2. national-museum (中国国家博物馆)
3. pinghu-museum (平湖博物馆)
4. beijing-capital-museum (首都博物馆)
5. china-art-museum (中国美术馆)
6. china-military-museum (中国军事博物馆)
7. beijing-natural-history-museum (北京自然博物馆)
8. china-railway-museum (中国铁道博物馆)
9. beijing-planetarium (北京天文馆)
10. beijing-art-museum (北京艺术博物馆)
11. china-science-technology-museum (中国科学技术馆)

## Future Enhancements

### Potential Improvements
1. **Automated QR Generation**: Add QR generation to CI/CD pipeline for new museums
2. **QR Code Analytics**: Track QR code scans for each museum
3. **Dynamic QR Codes**: Generate QR codes on-the-fly for all museums
4. **Customizable QR Designs**: Museum-branded QR codes with logos/colors
5. **Multi-language Support**: QR codes linking to language-specific pages

### Maintenance
- When adding new V3 museums, generate QR code using:
  ```bash
  node tools/generate-museum-qr.js {museum-id} MuseumCheck_QRCode_{FileName}.png
  ```
- Add the museum to the `museumQrCodes` mapping in `fireworks-wall.html`

## References

### Related Documentation
- `QR_CODE_VERIFICATION.md` - QR code URL verification guidelines
- `tools/generate-museum-qr.js` - QR code generation tool
- `MUSEUM_CHECKIN_DOC.md` - Museum check-in documentation

### Related Files
- `fireworks-wall.html` - Fireworks wall page with QR code display
- `museum-checkin.html` - Museum check-in destination page
- `MuseumCheck_QRCode_*.png` - Generated QR code files

## Conclusion

This implementation successfully adds museum-specific QR codes for all 11 V3-supported museums, enhancing the fireworks wall experience by providing direct check-in links for each museum. The solution:
- ✅ Uses existing infrastructure (minimal changes)
- ✅ Maintains backward compatibility
- ✅ Provides graceful fallback for edge cases
- ✅ Passes all existing tests
- ✅ Follows established naming conventions
- ✅ Documented and maintainable
