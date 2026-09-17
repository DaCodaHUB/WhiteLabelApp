import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';
import {buildClientArtworkFiles, loadClientArtwork} from '../scripts/clientArtwork';
import {writeFilesAtomically} from '../scripts/clientPackaging';
import {defaultConfig} from '../src/app/config/defaultConfig';

async function sourcePngs(directory: string, color: string) {
  fs.mkdirSync(path.join(directory, 'assets'), {recursive: true});
  const icon = await sharp({create: {width: 1024, height: 1024, channels: 4, background: color}}).png().toBuffer();
  const logoSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><circle cx="600" cy="600" r="400" fill="${color}"/></svg>`);
  const logo = await sharp(logoSvg).png().toBuffer();
  fs.writeFileSync(path.join(directory, 'assets', 'app-icon.png'), icon);
  fs.writeFileSync(path.join(directory, 'assets', 'splash-logo.png'), logo);
  fs.writeFileSync(path.join(directory, 'assets', 'brand-logo.png'), logo);
}

test('production artwork rejects missing and invalid source images', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'artwork-validation-'));
  const client = path.join(root, 'clients', 'sample-cafe');
  fs.mkdirSync(path.join(client, 'assets'), {recursive: true});
  await expect(loadClientArtwork(client, 'production', '#2563EB')).rejects.toThrow(/Missing assets\/app-icon.png/);
  fs.writeFileSync(path.join(client, 'assets', 'app-icon.png'), Buffer.from('invalid'));
  await expect(loadClientArtwork(client, 'development', '#2563EB')).rejects.toThrow(/Missing assets\/splash-logo.png/);
  await sourcePngs(client, '#CC3300');
  fs.writeFileSync(path.join(client, 'assets', 'app-icon.png'), await sharp({create: {width: 512, height: 512, channels: 4, background: '#CC3300'}}).png().toBuffer());
  await expect(loadClientArtwork(client, 'production', '#2563EB')).rejects.toThrow(/1024 x 1024/);
  fs.writeFileSync(path.join(client, 'assets', 'app-icon.png'), await sharp({create: {width: 1024, height: 1024, channels: 4, background: '#CC330080'}}).png().toBuffer());
  await expect(loadClientArtwork(client, 'production', '#2563EB')).rejects.toThrow(/fully opaque/);
  await sourcePngs(client, '#CC3300');
  fs.writeFileSync(path.join(client, 'assets', 'brand-logo.png'), Buffer.from('not a PNG'));
  await expect(loadClientArtwork(client, 'production', '#2563EB')).rejects.toThrow(/readable PNG/);
});

test('client A to B to A replaces every fixed branding output deterministically', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'artwork-switch-'));
  await sourcePngs(path.join(root, 'clients', 'client-a'), '#CC3300');
  await sourcePngs(path.join(root, 'clients', 'client-b'), '#0033CC');
  const a = await buildClientArtworkFiles(root, 'client-a', 'production', {...defaultConfig.branding, backgroundColor: '#FFF8F0'});
  const b = await buildClientArtworkFiles(root, 'client-b', 'production', {...defaultConfig.branding, backgroundColor: '#F0F8FF'});
  expect(a.map(file => file.path)).toEqual(b.map(file => file.path));
  expect(new Set(a.map(file => file.path)).size).toBe(a.length);
  const iconPath = path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-mdpi', 'client_launcher.png');
  const logoPath = path.join(root, 'src', 'generated', 'brand-logo.png');
  const storyboardPath = path.join(root, 'ios', 'WhiteLabelApp', 'ClientLaunchScreen.storyboard');
  const iosMarketingIcon = path.join(root, 'ios', 'WhiteLabelApp', 'Images.xcassets', 'ClientAppIcon.appiconset', 'icon-ios-marketing-1024@1x.png');
  writeFilesAtomically(a);
  expect((await sharp(iosMarketingIcon).metadata()).hasAlpha).toBe(false);
  const originalIcon = fs.readFileSync(iconPath);
  const originalLogo = fs.readFileSync(logoPath);
  const originalStoryboard = fs.readFileSync(storyboardPath);
  writeFilesAtomically(b);
  expect(fs.readFileSync(iconPath).equals(originalIcon)).toBe(false);
  expect(fs.readFileSync(logoPath).equals(originalLogo)).toBe(false);
  expect(fs.readFileSync(storyboardPath).equals(originalStoryboard)).toBe(false);
  writeFilesAtomically(a);
  expect(fs.readFileSync(iconPath).equals(originalIcon)).toBe(true);
  expect(fs.readFileSync(logoPath).equals(originalLogo)).toBe(true);
  expect(fs.readFileSync(storyboardPath).equals(originalStoryboard)).toBe(true);
  writeFilesAtomically(a);
  expect(fs.readFileSync(iconPath).equals(originalIcon)).toBe(true);
});
