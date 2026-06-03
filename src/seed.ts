import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Partner } from './common/entities/partner.entity';
import { Product, ProductType } from './common/entities/product.entity';
import { Offer, OfferStatus } from './offers/offer.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'solarapp',
  entities: [Partner, Product, Offer],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Connected to DB');

  // ── Clear (FK-safe order) ────────────────────────────────────────────────────
  await AppDataSource.query('DELETE FROM offers');
  await AppDataSource.query('DELETE FROM products');
  await AppDataSource.query('DELETE FROM partners');
  console.log('🗑  Cleared existing data');

  const partnerRepo = AppDataSource.getRepository(Partner);
  const productRepo = AppDataSource.getRepository(Product);
  const offerRepo   = AppDataSource.getRepository(Offer);

  // ── Partners ─────────────────────────────────────────────────────────────────
  const [solartech, sunpower, ekosolar, greenenergy, adriasolar] = await partnerRepo.save([
    { name: 'SolarTech d.o.o. Sarajevo', email: 'info@solartech.ba',      phone: '+387 33 201 500', address: 'Ferhadija 22, 71000 Sarajevo, BiH',                    website: 'https://solartech.ba',    latitude: 43.8563, longitude: 18.4131, isActive: true },
    { name: 'SunPower Croatia d.o.o.',   email: 'kontakt@sunpower.hr',     phone: '+385 1 555 0110', address: 'Ilica 100, 10000 Zagreb, Hrvatska',                    website: 'https://sunpower.hr',     latitude: 45.8150, longitude: 15.9819, isActive: true },
    { name: 'EkoSolar Mostar',           email: 'prodaja@ekosolar.ba',     phone: '+387 36 310 200', address: 'Bulevar Narodne Revolucije 15, 88000 Mostar, BiH',     website: 'https://ekosolar.ba',     latitude: 43.3438, longitude: 17.8078, isActive: true },
    { name: 'Green Energy Beograd',      email: 'office@greenenergy.rs',   phone: '+381 11 334 2200',address: 'Knez Mihailova 36, 11000 Beograd, Srbija',             website: 'https://greenenergy.rs',  latitude: 44.8176, longitude: 20.4569, isActive: true },
    { name: 'Adria Solar Split',         email: 'info@adriasolar.hr',      phone: '+385 21 480 100', address: 'Domovinskog rata 2, 21000 Split, Hrvatska',            website: 'https://adriasolar.hr',   latitude: 43.5081, longitude: 16.4402, isActive: true },
  ]);
  console.log('👥 Inserted 5 partners');

  // ── Helper ───────────────────────────────────────────────────────────────────
  const panel    = (partnerId: number, name: string, price: number, watts: number, eff: number, area: number, manufacturer: string, model: string) =>
    ({ partnerId, name, type: ProductType.PANEL,    price, powerWatts: watts, efficiencyPercent: eff, areaSqm: area, manufacturer, model, isActive: true });
  const inverter = (partnerId: number, name: string, price: number, watts: number, eff: number, manufacturer: string, model: string) =>
    ({ partnerId, name, type: ProductType.INVERTER, price, powerWatts: watts, efficiencyPercent: eff, manufacturer, model, isActive: true });
  const mounting = (partnerId: number, name: string, price: number, manufacturer: string, model: string, description: string) =>
    ({ partnerId, name, type: ProductType.MOUNTING, price, manufacturer, model, description, isActive: true });
  const battery  = (partnerId: number, name: string, price: number, manufacturer: string, model: string, description: string) =>
    ({ partnerId, name, type: ProductType.BATTERY,  price, manufacturer, model, description, isActive: true });
  const other    = (partnerId: number, name: string, price: number, manufacturer: string, model: string, description: string) =>
    ({ partnerId, name, type: ProductType.OTHER,    price, manufacturer, model, description, isActive: true });

  // ── Products — each partner gets their own catalogue ─────────────────────────

  // ---- SolarTech Sarajevo ----
  const [st_panel1, st_panel2, st_inv1, st_inv2, st_mount1, st_batt1, st_cable] = await productRepo.save([
    panel   (solartech.id, 'JA Solar JAM72S30 550W',       195, 550, 21.3, 2.58, 'JA Solar',       'JAM72S30-550/MR'),
    panel   (solartech.id, 'JA Solar JAM54S30 400W',       148, 400, 20.4, 1.96, 'JA Solar',       'JAM54S30-400/MR'),
    inverter(solartech.id, 'Huawei SUN2000 5KTL-M3',       820, 5000, 98.6, 'Huawei',             'SUN2000-5KTL-M3'),
    inverter(solartech.id, 'Huawei SUN2000 10KTL-M1',     1380, 10000, 98.8, 'Huawei',            'SUN2000-10KTL-M1'),
    mounting(solartech.id, 'K2 Systems RoofKit — Tile',      38, 'K2 Systems',    'CrossRail Tile',  'Per-panel rail & clamp for ceramic tile roofs'),
    battery (solartech.id, 'BYD Battery-Box Premium HVS 10',4200,'BYD',           'HVS 10.2',        '10.2 kWh stackable LFP battery'),
    other   (solartech.id, 'DC Cable + MC4 Kit',              85, 'Amphenol',      'MC4-ASSY-KIT',   '30m UV cable + 10 pairs MC4 connectors'),
  ]);

  // ---- SunPower Zagreb ----
  const [sp_panel1, sp_panel2, sp_inv1, sp_inv2, sp_mount1, sp_cable, sp_surge] = await productRepo.save([
    panel   (sunpower.id,  'LONGi Hi-MO6 420W',            155, 420, 21.1, 1.98, 'LONGi Solar',    'LR5-54HTH-420M'),
    panel   (sunpower.id,  'LONGi Hi-MO7 580W',            210, 580, 22.6, 2.56, 'LONGi Solar',    'LR5-72HGT-580M'),
    inverter(sunpower.id,  'SMA Sunny Boy 3.0',             690, 3000, 97.2, 'SMA',               'SB3.0-1AV-41'),
    inverter(sunpower.id,  'SMA Sunny Tripower 8.0',       1150, 8000, 98.3, 'SMA',               'STP8.0-3AV-40'),
    mounting(sunpower.id,  'Mounting Systems EcoFoot2+',    48, 'Mounting Systems','EcoFoot2+',     'Ballasted flat-roof solution, no penetration'),
    other   (sunpower.id,  'DC Cable + MC4 Kit',             85, 'Amphenol',       'MC4-ASSY-KIT',  '30m UV cable + 10 pairs MC4 connectors'),
    other   (sunpower.id,  'AC Surge Arrester Kit',         120, 'OBO Bettermann', 'SPC-SOLAR-KIT', 'AC/DC surge protection + combiner box'),
  ]);

  // ---- EkoSolar Mostar ----
  const [ek_panel1, ek_panel2, ek_inv1, ek_mount1, ek_mount2, ek_batt1] = await productRepo.save([
    panel   (ekosolar.id,  'Canadian Solar HiKu7 600W',    215, 600, 22.5, 2.67, 'Canadian Solar', 'CS7N-600MS'),
    panel   (ekosolar.id,  'Canadian Solar BiKu 450W',     168, 450, 21.0, 2.14, 'Canadian Solar', 'CS3W-450PB-AG'),
    inverter(ekosolar.id,  'Fronius Primo GEN24 8.0',     1350, 8000, 98.1, 'Fronius',           'Primo GEN24 8.0'),
    mounting(ekosolar.id,  'Schletter ClickFit EVO Tile',   40, 'Schletter',      'ClickFit EVO T', 'Easy-click tile roof system'),
    mounting(ekosolar.id,  'Schletter ClickFit EVO Flat',   52, 'Schletter',      'ClickFit EVO F', 'East-west ballasted flat roof system'),
    battery (ekosolar.id,  'Pylontech US5000 4.8kWh',     1850, 'Pylontech',      'US5000C',        '4.8 kWh stackable LFP, CAN/RS485 BMS'),
  ]);

  // ---- Green Energy Beograd ----
  const [ge_panel1, ge_panel2, ge_inv1, ge_inv2, ge_mount1, ge_cable, ge_surge] = await productRepo.save([
    panel   (greenenergy.id,'Risen Energy Titan S 550W',   185, 550, 21.0, 2.56, 'Risen Energy',   'RSM110-8-550BMDG'),
    panel   (greenenergy.id,'Risen Energy Titan S 430W',   145, 430, 20.3, 2.12, 'Risen Energy',   'RSM40-8-430M'),
    inverter(greenenergy.id,'Growatt MIN 6000TL-X',         650, 6000, 97.5, 'Growatt',           'MIN 6000TL-X'),
    inverter(greenenergy.id,'Growatt MOD 10KTL3-X',        1050, 10000, 98.4, 'Growatt',          'MOD 10KTL3-X'),
    mounting(greenenergy.id,'IronRidge XR100 Rail Kit',      42, 'IronRidge',      'XR100',          'Universal flush-mount rail system'),
    other   (greenenergy.id,'DC Cable + MC4 Kit',            85, 'Amphenol',       'MC4-ASSY-KIT',  '30m UV cable + 10 pairs MC4 connectors'),
    other   (greenenergy.id,'Smart Energy Meter 3-phase',  145, 'Eastron',         'SDM630-Modbus',  '3-phase bidirectional energy meter'),
  ]);

  // ---- Adria Solar Split ----
  const [as_panel1, as_panel2, as_inv1, as_inv2, as_mount1, as_batt1, as_cable] = await productRepo.save([
    panel   (adriasolar.id,'Trina Solar Vertex S+ 420W',   152, 420, 21.4, 1.97, 'Trina Solar',    'TSM-420NEG9R.28'),
    panel   (adriasolar.id,'Trina Solar Vertex S+ 500W',   182, 500, 21.8, 2.29, 'Trina Solar',    'TSM-500NEG9R.28'),
    inverter(adriasolar.id,'Sungrow SG5.0RT',               760, 5000, 98.4, 'Sungrow',           'SG5.0RT'),
    inverter(adriasolar.id,'Sungrow SH8.0RT (Hybrid)',     1280, 8000, 97.7, 'Sungrow',           'SH8.0RT'),
    mounting(adriasolar.id,'K2 Systems MiniRail — Flat',    45, 'K2 Systems',     'MiniRail Flat',   'Low-ballast flat roof system, portrait/landscape'),
    battery (adriasolar.id,'Sungrow SBR096 9.6kWh',       3600, 'Sungrow',        'SBR096',          '9.6 kWh HV lithium battery, pairs with SH inverters'),
    other   (adriasolar.id,'AC Surge Arrester Kit',         120, 'OBO Bettermann', 'SPC-SOLAR-KIT', 'AC/DC surge protection + combiner box'),
  ]);

  const totalProducts = 7 + 7 + 6 + 7 + 7;
  console.log(`📦 Inserted ${totalProducts} products (linked to partners)`);

  // ── Offers (partner × product price list) ────────────────────────────────────
  const today    = new Date();
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const o = (name: string, partnerId: number, productId: number, price: number, discount: number, warranty: number) =>
    ({ name, partnerId, productId, price, discountPercent: discount, warrantyYears: warranty, status: OfferStatus.ACTIVE, validFrom: today, validUntil: nextYear });

  await offerRepo.save([
    // SolarTech Sarajevo
    o('JA 550W — SolarTech',          solartech.id, st_panel1.id,  185, 5, 25),
    o('JA 400W — SolarTech',          solartech.id, st_panel2.id,  142, 5, 25),
    o('Huawei 5kW — SolarTech',       solartech.id, st_inv1.id,    790, 4, 10),
    o('Huawei 10kW — SolarTech',      solartech.id, st_inv2.id,   1320, 4, 10),
    o('K2 Tile Mount — SolarTech',    solartech.id, st_mount1.id,   35, 0, 10),
    o('BYD Battery — SolarTech',      solartech.id, st_batt1.id,  4100, 3, 10),
    o('DC Cable Kit — SolarTech',     solartech.id, st_cable.id,    82, 0,  2),
    // SunPower Zagreb
    o('LONGi 420W — SunPower',        sunpower.id,  sp_panel1.id,  148, 5, 25),
    o('LONGi 580W — SunPower',        sunpower.id,  sp_panel2.id,  205, 5, 25),
    o('SMA 3kW — SunPower',           sunpower.id,  sp_inv1.id,    660, 4, 10),
    o('SMA 8kW — SunPower',           sunpower.id,  sp_inv2.id,   1100, 4, 10),
    o('EcoFoot Flat Mount — SunPower',sunpower.id,  sp_mount1.id,   46, 0, 10),
    o('DC Cable Kit — SunPower',      sunpower.id,  sp_cable.id,    82, 0,  2),
    o('AC Surge Kit — SunPower',      sunpower.id,  sp_surge.id,   115, 0,  2),
    // EkoSolar Mostar
    o('CS 600W — EkoSolar',           ekosolar.id,  ek_panel1.id,  205, 3, 25),
    o('CS BiKu 450W — EkoSolar',      ekosolar.id,  ek_panel2.id,  162, 3, 25),
    o('Fronius 8kW — EkoSolar',       ekosolar.id,  ek_inv1.id,   1290, 5, 10),
    o('Schletter Tile — EkoSolar',    ekosolar.id,  ek_mount1.id,   38, 0, 10),
    o('Schletter Flat — EkoSolar',    ekosolar.id,  ek_mount2.id,   50, 0, 10),
    o('Pylontech 4.8kWh — EkoSolar',  ekosolar.id,  ek_batt1.id,  1800, 0, 10),
    // Green Energy Beograd
    o('Risen 550W — GreenEnergy',     greenenergy.id,ge_panel1.id,  180, 0, 25),
    o('Risen 430W — GreenEnergy',     greenenergy.id,ge_panel2.id,  140, 0, 25),
    o('Growatt 6kW — GreenEnergy',    greenenergy.id,ge_inv1.id,    630, 2, 10),
    o('Growatt 10kW — GreenEnergy',   greenenergy.id,ge_inv2.id,   1020, 2, 10),
    o('IronRidge Rail — GreenEnergy', greenenergy.id,ge_mount1.id,   40, 0, 10),
    o('DC Cable Kit — GreenEnergy',   greenenergy.id,ge_cable.id,    82, 0,  2),
    o('Energy Meter — GreenEnergy',   greenenergy.id,ge_surge.id,   140, 0,  2),
    // Adria Solar Split
    o('Trina 420W — AdriaSolar',      adriasolar.id,as_panel1.id,  148, 8, 25),
    o('Trina 500W — AdriaSolar',      adriasolar.id,as_panel2.id,  178, 6, 25),
    o('Sungrow 5kW — AdriaSolar',     adriasolar.id,as_inv1.id,    740, 3, 10),
    o('Sungrow 8kW Hybrid — Adria',   adriasolar.id,as_inv2.id,   1250, 3, 10),
    o('K2 MiniRail Flat — AdriaSolar',adriasolar.id,as_mount1.id,   43, 0, 10),
    o('Sungrow Battery 9.6kWh — Adria',adriasolar.id,as_batt1.id, 3500, 2, 10),
    o('AC Surge Kit — AdriaSolar',    adriasolar.id,as_cable.id,   115, 0,  2),
  ]);

  console.log('🤝 Inserted 34 offers');
  console.log('\n🌱 Seed complete!');
  console.log('   Partners: 5');
  console.log(`   Products: ${totalProducts} (each linked to a partner)`);
  console.log('   Offers  : 34');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
