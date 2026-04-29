import { PrismaClient, Role, ListingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // We are not deleting existing data to keep it idempotent/append-only.
  // Instead, we use upsert logic for users and listings.

  // 1. Ensure Users Exist
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@carmarket.com" },
    update: {},
    create: {
      email: "admin@carmarket.com",
      name: "Admin User",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const seller1 = await prisma.user.upsert({
    where: { email: "seller@carmarket.com" },
    update: {},
    create: {
      email: "seller@carmarket.com",
      name: "John Seller",
      passwordHash,
      role: Role.SELLER,
    },
  });

  const buyer1 = await prisma.user.upsert({
    where: { email: "buyer@carmarket.com" },
    update: {},
    create: {
      email: "buyer@carmarket.com",
      name: "Jane Buyer",
      passwordHash,
      role: Role.BUYER,
    },
  });

  console.log("✅ Ensured users exist:", { admin: admin.email, seller1: seller1.email, buyer1: buyer1.email });

  const sellers = [admin.id, seller1.id, buyer1.id];

  // Helper for Cloudinary placeholder
  const getPlaceholder = (brand: string, model: string, year: number) => 
    `https://res.cloudinary.com/demo/image/upload/car_${brand.toLowerCase()}_${model.toLowerCase().replace(/ /g, '_')}_${year}.jpg`;

  // Original 8 listings
  const originalListings = [
    {
      title: "2023 BMW M3 Competition - Low Miles",
      brand: "BMW",
      model: "M3 Competition",
      year: 2023,
      mileage: 8200,
      price: 78500,
      description: "Pristine 2023 BMW M3 Competition in iconic Alpine White. This beast features the S58 twin-turbo inline-6 producing 503 hp. Full M Driver's Package, carbon fiber bucket seats, and Merino leather interior. Full BMW dealer service history. Never tracked. Includes M Carbon Exterior Package and M Pro Mode. Truly one of the finest sports sedans ever built.",
      status: ListingStatus.ACTIVE,
      images: [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&auto=format&fit=crop",
      ],
      sellerId: seller1.id,
    },
    {
      title: "2022 Mercedes-Benz S-Class S500 4MATIC",
      brand: "Mercedes-Benz",
      model: "S500 4MATIC",
      year: 2022,
      mileage: 22400,
      price: 95000,
      description: "Experience the pinnacle of luxury with this stunning 2022 Mercedes-Benz S-Class. Finished in Obsidian Black Metallic over Macchiato Beige/Black Nappa leather. Features include the Executive Rear Seat Package Plus, Burmester 4D surround sound, rear axle steering, and the incredible MBUX augmented reality navigation. Immaculate condition with full MB service history.",
      status: ListingStatus.ACTIVE,
      images: [
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop",
      ],
      sellerId: seller1.id,
    },
    {
      title: "2023 Tesla Model S Plaid - Ludicrous Mode",
      brand: "Tesla",
      model: "Model S Plaid",
      year: 2023,
      mileage: 5100,
      price: 115000,
      description: "The fastest production sedan in the world — Tesla Model S Plaid. 0-60 in under 2 seconds with 1,020 hp from three electric motors. Range of 396 miles. Features Autopilot, FSD capability, 17-inch cinematic display, Yoke steering wheel, and carbon fiber interior trim. Software version up to date. Charging equipment included.",
      status: ListingStatus.ACTIVE,
      images: [
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571987502951-3cc342b6e99e?w=800&auto=format&fit=crop",
      ],
      sellerId: seller1.id,
    },
    {
      title: "2021 Audi RS6 Avant - Wagon Perfection",
      brand: "Audi",
      model: "RS6 Avant",
      year: 2021,
      mileage: 34700,
      price: 89000,
      description: "The ultimate family supercar — Audi RS6 Avant. 4.0L twin-turbo V8 producing 591 hp with 48V mild hybrid system. Nardo Grey exterior with Valcona leather interior. Dynamic Ride Control air suspension, carbon fiber ceramic brakes, night vision assist, and panoramic sunroof. Audi Sport steering wheel and RS-specific design elements throughout.",
      status: ListingStatus.ACTIVE,
      images: [
        "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&auto=format&fit=crop",
      ],
      sellerId: seller1.id,
    },
    {
      title: "2022 Porsche 911 GT3 - Touring Package",
      brand: "Porsche",
      model: "911 GT3 Touring",
      year: 2022,
      mileage: 4800,
      price: 198000,
      description: "Extremely rare 2022 Porsche 911 GT3 with Touring Package — the subtle GT3. GT Silver Metallic exterior with Black leather and Alcantara interior. The naturally-aspirated 4.0L flat-six screams to 9,000 RPM producing 502 hp. 6-speed manual transmission. Lightweight flywheel, PCCB ceramic brakes, front axle lift, and Club Sport Package. Investment grade vehicle.",
      status: ListingStatus.ACTIVE,
      images: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&auto=format&fit=crop",
      ],
      sellerId: seller1.id,
    },
    {
      title: "2020 Ford Mustang Shelby GT500",
      brand: "Ford",
      model: "Mustang Shelby GT500",
      year: 2020,
      mileage: 18900,
      price: 82000,
      description: "America's most powerful street-legal production car — the 2020 Ford Mustang Shelby GT500. Supercharged 5.2L V8 producing 760 hp. Velocity Blue exterior with Shelby-specific badging and carbon fiber track package. Tremec 7-speed dual-clutch transmission. Magnetic ride control, Brembo brakes, and active valve exhaust make this a true track weapon. Dealer serviced, clean title.",
      status: ListingStatus.ACTIVE,
      images: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop",
      ],
      sellerId: seller1.id,
    },
    {
      title: "2023 Toyota Land Cruiser GR Sport",
      brand: "Toyota",
      model: "Land Cruiser GR Sport",
      year: 2023,
      mileage: 12300,
      price: 68000,
      description: "The legendary Toyota Land Cruiser reimagined for the modern era. Twin-turbo V6 with 409 hp and incredible off-road capability from the e-KDSS suspension system. GR Sport adds sportier styling, 22-inch wheels, and exclusive interior touches. Multi-terrain select, crawl control, and Toyota Safety Sense 3.0. Towing capacity of 8,100 lbs. The definitive luxury off-roader.",
      status: ListingStatus.ACTIVE,
      images: [
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?w=800&auto=format&fit=crop",
      ],
      sellerId: seller1.id,
    },
    {
      title: "2019 Honda Civic Type R - Championship White",
      brand: "Honda",
      model: "Civic Type R",
      year: 2019,
      mileage: 41200,
      price: 35500,
      description: "FK8 Honda Civic Type R in the iconic Championship White. The most powerful Honda road car ever sold in the US. 2.0L VTEC turbo producing 306 hp through a 6-speed manual transmission. Three driving modes, Brembo brakes, and Bilstein dampers. Completely stock with all original parts. No modifications, no track use. Full service history. A future classic.",
      status: ListingStatus.ACTIVE,
      images: [
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop",
      ],
      sellerId: seller1.id,
    },
  ];

  // 20 New Listings
  const newListings = [
    {
      title: "2019 Toyota Camry SE — Low Mileage",
      brand: "Toyota",
      model: "Camry",
      year: 2019,
      mileage: 45000,
      price: 22000,
      description: "Excellent condition 2019 Toyota Camry SE. Dealer maintained with full service records. Great fuel economy and very reliable.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Toyota", "Camry", 2019)],
      sellerId: sellers[0],
    },
    {
      title: "2021 Honda Civic EX",
      brand: "Honda",
      model: "Civic",
      year: 2021,
      mileage: 30000,
      price: 24000,
      description: "Like-new Honda Civic EX with sunroof and Apple CarPlay. Only one previous owner. Minor scratch on the rear bumper.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Honda", "Civic", 2021)],
      sellerId: sellers[1],
    },
    {
      title: "2018 BMW 330i xDrive",
      brand: "BMW",
      model: "3 Series",
      year: 2018,
      mileage: 65000,
      price: 28000,
      description: "Beautiful BMW 330i xDrive in Alpine White. All-wheel drive perfect for winter. Includes the premium package with heated seats and steering wheel.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("BMW", "3 Series", 2018)],
      sellerId: sellers[2],
    },
    {
      title: "2020 Mercedes-Benz GLC 300",
      brand: "Mercedes-Benz",
      model: "GLC",
      year: 2020,
      mileage: 50000,
      price: 35000,
      description: "Luxury compact SUV in excellent shape. Regularly serviced at the Mercedes dealership. Features panoramic roof and Burmester audio.",
      status: ListingStatus.SOLD,
      images: [getPlaceholder("Mercedes-Benz", "GLC", 2020)],
      sellerId: sellers[0],
    },
    {
      title: "2017 Ford F-150 XLT 4x4",
      brand: "Ford",
      model: "F-150",
      year: 2017,
      mileage: 85000,
      price: 29000,
      description: "Tough and ready Ford F-150 XLT with the 3.5L EcoBoost engine. Includes towing package and bed liner. Clean title.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Ford", "F-150", 2017)],
      sellerId: sellers[1],
    },
    {
      title: "2022 Hyundai Tucson Limited",
      brand: "Hyundai",
      model: "Tucson",
      year: 2022,
      mileage: 15000,
      price: 32000,
      description: "Top trim Hyundai Tucson with all the safety features. Leather interior, surround view monitor, and remaining factory warranty.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Hyundai", "Tucson", 2022)],
      sellerId: sellers[2],
    },
    {
      title: "2019 Kia Sorento SX",
      brand: "Kia",
      model: "Sorento",
      year: 2019,
      mileage: 70000,
      price: 23000,
      description: "Spacious 3-row SUV perfect for families. V6 engine provides plenty of power. New tires installed last month.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Kia", "Sorento", 2019)],
      sellerId: sellers[0],
    },
    {
      title: "2021 Audi Q5 Premium Plus",
      brand: "Audi",
      model: "Q5",
      year: 2021,
      mileage: 40000,
      price: 38000,
      description: "Premium luxury SUV with legendary Quattro all-wheel drive. Virtual cockpit and Bang & Olufsen sound system. Impeccable condition.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Audi", "Q5", 2021)],
      sellerId: sellers[1],
    },
    {
      title: "2016 Nissan Altima 2.5 SR",
      brand: "Nissan",
      model: "Altima",
      year: 2016,
      mileage: 110000,
      price: 14000,
      description: "Sporty and reliable Nissan Altima. Great commuter car with excellent gas mileage. Regular oil changes every 5,000 miles.",
      status: ListingStatus.DRAFT,
      images: [getPlaceholder("Nissan", "Altima", 2016)],
      sellerId: sellers[2],
    },
    {
      title: "2020 Chevrolet Silverado 1500 LT",
      brand: "Chevrolet",
      model: "Silverado",
      year: 2020,
      mileage: 60000,
      price: 39000,
      description: "Chevy Silverado 1500 LT Crew Cab. 5.3L V8 engine. Comes with a tonneau cover and upgraded all-terrain tires.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Chevrolet", "Silverado", 2020)],
      sellerId: sellers[0],
    },
    {
      title: "2023 Toyota RAV4 Hybrid XLE",
      brand: "Toyota",
      model: "RAV4",
      year: 2023,
      mileage: 12000,
      price: 36000,
      description: "Hard to find RAV4 Hybrid! Amazing fuel efficiency. Practically brand new with barely any miles. Clean Carfax.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Toyota", "RAV4", 2023)],
      sellerId: sellers[1],
    },
    {
      title: "2018 Honda Accord Touring",
      brand: "Honda",
      model: "Accord",
      year: 2018,
      mileage: 55000,
      price: 26000,
      description: "Fully loaded Honda Accord Touring with the 2.0T engine. Ventilated seats, heads-up display, and adaptive suspension. A joy to drive.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Honda", "Accord", 2018)],
      sellerId: sellers[2],
    },
    {
      title: "2019 BMW X5 xDrive40i",
      brand: "BMW",
      model: "X5",
      year: 2019,
      mileage: 75000,
      price: 42000,
      description: "Luxurious BMW X5 with a smooth inline-6 engine. Features a third-row seat and rear-seat entertainment system. Garage kept.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("BMW", "X5", 2019)],
      sellerId: sellers[0],
    },
    {
      title: "2021 Mercedes-Benz C300",
      brand: "Mercedes-Benz",
      model: "C-Class",
      year: 2021,
      mileage: 35000,
      price: 36000,
      description: "Elegant C300 sedan in Polar White. Ambient lighting, AMG line package, and fully digital instrument cluster. Needs nothing.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Mercedes-Benz", "C-Class", 2021)],
      sellerId: sellers[1],
    },
    {
      title: "2015 Ford Explorer Limited",
      brand: "Ford",
      model: "Explorer",
      year: 2015,
      mileage: 120000,
      price: 16000,
      description: "Reliable family hauler with 3 rows of seating. Leather seats, navigation, and dual-panel moonroof. Has some wear but runs great.",
      status: ListingStatus.SOLD,
      images: [getPlaceholder("Ford", "Explorer", 2015)],
      sellerId: sellers[2],
    },
    {
      title: "2022 Hyundai Elantra SEL",
      brand: "Hyundai",
      model: "Elantra",
      year: 2022,
      mileage: 20000,
      price: 21000,
      description: "Sharp looking Hyundai Elantra with modern tech. Features wireless Apple CarPlay and Android Auto. Balance of the 10-year warranty remains.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Hyundai", "Elantra", 2022)],
      sellerId: sellers[0],
    },
    {
      title: "2020 Kia Telluride EX",
      brand: "Kia",
      model: "Telluride",
      year: 2020,
      mileage: 45000,
      price: 34000,
      description: "Highly sought-after Kia Telluride. Spacious interior with premium feel. Includes the towing package and captain's chairs.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Kia", "Telluride", 2020)],
      sellerId: sellers[1],
    },
    {
      title: "2017 Audi A4 2.0T Premium",
      brand: "Audi",
      model: "A4",
      year: 2017,
      mileage: 80000,
      price: 19000,
      description: "Sleek and sporty Audi A4. Features a turbocharged engine and Quattro AWD. Sunroof and leather interior. Maintenance up to date.",
      status: ListingStatus.DRAFT,
      images: [getPlaceholder("Audi", "A4", 2017)],
      sellerId: sellers[2],
    },
    {
      title: "2019 Nissan Rogue SV",
      brand: "Nissan",
      model: "Rogue",
      year: 2019,
      mileage: 65000,
      price: 18000,
      description: "Comfortable and practical Nissan Rogue. Features ProPILOT Assist and a power liftgate. Very clean interior.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Nissan", "Rogue", 2019)],
      sellerId: sellers[0],
    },
    {
      title: "2021 Chevrolet Equinox LT",
      brand: "Chevrolet",
      model: "Equinox",
      year: 2021,
      mileage: 40000,
      price: 22000,
      description: "Great compact SUV for daily driving. Features heated seats and a power driver's seat. No accidents, clean history.",
      status: ListingStatus.ACTIVE,
      images: [getPlaceholder("Chevrolet", "Equinox", 2021)],
      sellerId: sellers[1],
    },
  ];

  const allListings = [...originalListings, ...newListings];

  let addedCount = 0;
  let updatedCount = 0;
  const createdListingIds: string[] = [];

  for (const data of allListings) {
    const existing = await prisma.listing.findFirst({
      where: { title: data.title },
    });

    if (existing) {
      const updated = await prisma.listing.update({
        where: { id: existing.id },
        data,
      });
      createdListingIds.push(updated.id);
      updatedCount++;
    } else {
      const created = await prisma.listing.create({
        data,
      });
      createdListingIds.push(created.id);
      addedCount++;
    }
  }

  console.log(`✅ Upserted listings: ${addedCount} added, ${updatedCount} updated.`);

  // Create sample inquiries
  // Check if inquiries exist to avoid duplicates
  const inquiry1Exists = await prisma.inquiry.findFirst({
    where: { listingId: createdListingIds[0], buyerId: buyer1.id }
  });

  if (!inquiry1Exists) {
    await prisma.inquiry.create({
      data: {
        message: "Hi John, I'm very interested in the BMW M3. Could you tell me more about the maintenance history and if there are any known issues? I'd love to schedule a test drive this weekend if possible.",
        listingId: createdListingIds[0],
        buyerId: buyer1.id,
        status: "UNREAD",
      },
    });
  }

  const inquiry2Exists = await prisma.inquiry.findFirst({
    where: { listingId: createdListingIds[2], buyerId: buyer1.id }
  });

  if (!inquiry2Exists) {
    await prisma.inquiry.create({
      data: {
        message: "Hello! The Tesla Model S Plaid looks amazing. Does it still have the original warranty? I'm also curious about the FSD package — is the full purchase price included or is it a subscription?",
        listingId: createdListingIds[2],
        buyerId: buyer1.id,
        status: "READ",
      },
    });
  }

  console.log("✅ Ensured sample inquiries exist");
  console.log("");
  console.log("🎉 Seed completed successfully!");
  console.log("");
  console.log("📋 Test credentials:");
  console.log("   Admin:  admin@carmarket.com / Password123!");
  console.log("   Seller: seller@carmarket.com / Password123!");
  console.log("   Buyer:  buyer@carmarket.com / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
