import { PrismaClient, Role, ListingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await prisma.inquiry.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@carmarket.com",
      name: "Admin User",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      email: "seller@carmarket.com",
      name: "John Seller",
      passwordHash,
      role: Role.SELLER,
    },
  });

  const buyer1 = await prisma.user.create({
    data: {
      email: "buyer@carmarket.com",
      name: "Jane Buyer",
      passwordHash,
      role: Role.BUYER,
    },
  });

  console.log("✅ Created users:", { admin: admin.email, seller1: seller1.email, buyer1: buyer1.email });

  // Sample Cloudinary placeholder images (using picsum for demo)
  const carImages = {
    bmw: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&auto=format&fit=crop",
    ],
    mercedes: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop",
    ],
    tesla: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571987502951-3cc342b6e99e?w=800&auto=format&fit=crop",
    ],
    audi: [
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&auto=format&fit=crop",
    ],
    porsche: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&auto=format&fit=crop",
    ],
    ford: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop",
    ],
    toyota: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?w=800&auto=format&fit=crop",
    ],
    honda: [
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop",
    ],
  };

  // Create listings
  const listings = await Promise.all([
    prisma.listing.create({
      data: {
        title: "2023 BMW M3 Competition - Low Miles",
        brand: "BMW",
        model: "M3 Competition",
        year: 2023,
        mileage: 8200,
        price: 78500,
        description:
          "Pristine 2023 BMW M3 Competition in iconic Alpine White. This beast features the S58 twin-turbo inline-6 producing 503 hp. Full M Driver's Package, carbon fiber bucket seats, and Merino leather interior. Full BMW dealer service history. Never tracked. Includes M Carbon Exterior Package and M Pro Mode. Truly one of the finest sports sedans ever built.",
        status: ListingStatus.ACTIVE,
        images: carImages.bmw,
        sellerId: seller1.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: "2022 Mercedes-Benz S-Class S500 4MATIC",
        brand: "Mercedes-Benz",
        model: "S500 4MATIC",
        year: 2022,
        mileage: 22400,
        price: 95000,
        description:
          "Experience the pinnacle of luxury with this stunning 2022 Mercedes-Benz S-Class. Finished in Obsidian Black Metallic over Macchiato Beige/Black Nappa leather. Features include the Executive Rear Seat Package Plus, Burmester 4D surround sound, rear axle steering, and the incredible MBUX augmented reality navigation. Immaculate condition with full MB service history.",
        status: ListingStatus.ACTIVE,
        images: carImages.mercedes,
        sellerId: seller1.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: "2023 Tesla Model S Plaid - Ludicrous Mode",
        brand: "Tesla",
        model: "Model S Plaid",
        year: 2023,
        mileage: 5100,
        price: 115000,
        description:
          "The fastest production sedan in the world — Tesla Model S Plaid. 0-60 in under 2 seconds with 1,020 hp from three electric motors. Range of 396 miles. Features Autopilot, FSD capability, 17-inch cinematic display, Yoke steering wheel, and carbon fiber interior trim. Software version up to date. Charging equipment included.",
        status: ListingStatus.ACTIVE,
        images: carImages.tesla,
        sellerId: seller1.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: "2021 Audi RS6 Avant - Wagon Perfection",
        brand: "Audi",
        model: "RS6 Avant",
        year: 2021,
        mileage: 34700,
        price: 89000,
        description:
          "The ultimate family supercar — Audi RS6 Avant. 4.0L twin-turbo V8 producing 591 hp with 48V mild hybrid system. Nardo Grey exterior with Valcona leather interior. Dynamic Ride Control air suspension, carbon fiber ceramic brakes, night vision assist, and panoramic sunroof. Audi Sport steering wheel and RS-specific design elements throughout.",
        status: ListingStatus.ACTIVE,
        images: carImages.audi,
        sellerId: seller1.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: "2022 Porsche 911 GT3 - Touring Package",
        brand: "Porsche",
        model: "911 GT3 Touring",
        year: 2022,
        mileage: 4800,
        price: 198000,
        description:
          "Extremely rare 2022 Porsche 911 GT3 with Touring Package — the subtle GT3. GT Silver Metallic exterior with Black leather and Alcantara interior. The naturally-aspirated 4.0L flat-six screams to 9,000 RPM producing 502 hp. 6-speed manual transmission. Lightweight flywheel, PCCB ceramic brakes, front axle lift, and Club Sport Package. Investment grade vehicle.",
        status: ListingStatus.ACTIVE,
        images: carImages.porsche,
        sellerId: seller1.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: "2020 Ford Mustang Shelby GT500",
        brand: "Ford",
        model: "Mustang Shelby GT500",
        year: 2020,
        mileage: 18900,
        price: 82000,
        description:
          "America's most powerful street-legal production car — the 2020 Ford Mustang Shelby GT500. Supercharged 5.2L V8 producing 760 hp. Velocity Blue exterior with Shelby-specific badging and carbon fiber track package. Tremec 7-speed dual-clutch transmission. Magnetic ride control, Brembo brakes, and active valve exhaust make this a true track weapon. Dealer serviced, clean title.",
        status: ListingStatus.ACTIVE,
        images: carImages.ford,
        sellerId: seller1.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: "2023 Toyota Land Cruiser GR Sport",
        brand: "Toyota",
        model: "Land Cruiser GR Sport",
        year: 2023,
        mileage: 12300,
        price: 68000,
        description:
          "The legendary Toyota Land Cruiser reimagined for the modern era. Twin-turbo V6 with 409 hp and incredible off-road capability from the e-KDSS suspension system. GR Sport adds sportier styling, 22-inch wheels, and exclusive interior touches. Multi-terrain select, crawl control, and Toyota Safety Sense 3.0. Towing capacity of 8,100 lbs. The definitive luxury off-roader.",
        status: ListingStatus.ACTIVE,
        images: carImages.toyota,
        sellerId: seller1.id,
      },
    }),
    prisma.listing.create({
      data: {
        title: "2019 Honda Civic Type R - Championship White",
        brand: "Honda",
        model: "Civic Type R",
        year: 2019,
        mileage: 41200,
        price: 35500,
        description:
          "FK8 Honda Civic Type R in the iconic Championship White. The most powerful Honda road car ever sold in the US. 2.0L VTEC turbo producing 306 hp through a 6-speed manual transmission. Three driving modes, Brembo brakes, and Bilstein dampers. Completely stock with all original parts. No modifications, no track use. Full service history. A future classic.",
        status: ListingStatus.ACTIVE,
        images: carImages.honda,
        sellerId: seller1.id,
      },
    }),
  ]);

  console.log(`✅ Created ${listings.length} listings`);

  // Create sample inquiries
  await prisma.inquiry.create({
    data: {
      message:
        "Hi John, I'm very interested in the BMW M3. Could you tell me more about the maintenance history and if there are any known issues? I'd love to schedule a test drive this weekend if possible.",
      listingId: listings[0].id,
      buyerId: buyer1.id,
      status: "UNREAD",
    },
  });

  await prisma.inquiry.create({
    data: {
      message:
        "Hello! The Tesla Model S Plaid looks amazing. Does it still have the original warranty? I'm also curious about the FSD package — is the full purchase price included or is it a subscription?",
      listingId: listings[2].id,
      buyerId: buyer1.id,
      status: "READ",
    },
  });

  console.log("✅ Created sample inquiries");
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
