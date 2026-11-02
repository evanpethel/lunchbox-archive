import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/db/client.js";

// Test accounts for local development and TA verification only.
// Never reuse this password anywhere real.
const TEST_PASSWORD = "password123";
const SELLERS = ["seed_seller1", "seed_seller2"];
const BUYER = "seed_buyer";

const listings = [
  { title: "1965 Snoopy Metal Lunchbox", description: "Classic metal lunchbox with matching thermos, some paint wear on the edges", price: 45, photoUrl: "https://placehold.co/300x200", age: "1960s", condition: "Good", maker: "Thermos" },
  { title: "1985 Transformers Lunchbox", description: "Plastic dome lid, minor scratches, no thermos included", price: 30, photoUrl: "https://placehold.co/300x200", age: "1980s", condition: "Fair", maker: "Aladdin" },
  { title: "1950s Roy Rogers Lunchbox", description: "Rare early vinyl lunchbox, excellent condition, no cracks", price: 120, photoUrl: "https://placehold.co/300x200", age: "1950s", condition: "Excellent", maker: "American Thermos" },
  { title: "1977 Star Wars Lunchbox", description: "Original movie artwork, dome shape, missing thermos cup", price: 65, photoUrl: "https://placehold.co/300x200", age: "1970s", condition: "Good", maker: "King Seeley" },
  { title: "1990s Jurassic Park Lunchbox", description: "Plastic lunchbox, vibrant colors still intact, includes matching water bottle", price: 25, photoUrl: "https://placehold.co/300x200", age: "1990s", condition: "Excellent", maker: "Thermos" },
  { title: "1962 Beatles Lunchbox", description: "Highly collectible, some rust on the hinges but graphics are vivid", price: 200, photoUrl: "https://placehold.co/300x200", age: "1960s", condition: "Fair", maker: "Aladdin" },
  { title: "1983 He-Man Lunchbox", description: "Metal lunchbox with thermos, light surface rust, great display piece", price: 55, photoUrl: "https://placehold.co/300x200", age: "1980s", condition: "Good", maker: "Aladdin" },
  { title: "1958 Disneyland Lunchbox", description: "Dome-top metal lunchbox featuring early Disneyland artwork", price: 150, photoUrl: "https://placehold.co/300x200", age: "1950s", condition: "Good", maker: "American Thermos" },
  { title: "1976 KISS Lunchbox", description: "Band artwork lunchbox, some fading on the front panel", price: 90, photoUrl: "https://placehold.co/300x200", age: "1970s", condition: "Fair", maker: "King Seeley" },
  { title: "1995 Power Rangers Lunchbox", description: "Plastic lunchbox, includes thermos, minor wear on clasp", price: 20, photoUrl: "https://placehold.co/300x200", age: "1990s", condition: "Good", maker: "Thermos" },
  { title: "1968 Flintstones Lunchbox", description: "Vibrant cartoon artwork, small dent on back panel", price: 110, photoUrl: "https://placehold.co/300x200", age: "1960s", condition: "Good", maker: "Aladdin" },
  { title: "1988 Ghostbusters Lunchbox", description: "Dome lid lunchbox, complete with thermos, great condition", price: 48, photoUrl: "https://placehold.co/300x200", age: "1980s", condition: "Excellent", maker: "Aladdin" },
  { title: "1972 Partridge Family Lunchbox", description: "Metal lunchbox, noticeable rust spots but artwork is clear", price: 35, photoUrl: "https://placehold.co/300x200", age: "1970s", condition: "Fair", maker: "King Seeley" },
  { title: "1998 Pokemon Lunchbox", description: "Plastic lunchbox featuring original 151 artwork, excellent shape", price: 40, photoUrl: "https://placehold.co/300x200", age: "1990s", condition: "Excellent", maker: "Thermos" },
  { title: "1954 Howdy Doody Lunchbox", description: "One of the earliest licensed character lunchboxes, some wear consistent with age", price: 175, photoUrl: "https://placehold.co/300x200", age: "1950s", condition: "Fair", maker: "American Thermos" },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // Create the test accounts if they don't exist yet.
  const users = {};
  for (const username of [...SELLERS, BUYER]) {
    users[username] = await prisma.user.upsert({
      where: { username },
      update: {},
      create: { username, passwordHash },
    });
  }

  // Reset the seed sellers' listings so running the seed twice doesn't duplicate them.
  // Note: this also removes any listings created by hand under the seed seller accounts.
  const sellerIds = SELLERS.map((name) => users[name].id);
  await prisma.post.deleteMany({ where: { sellerId: { in: sellerIds } } });

  await prisma.post.createMany({
    data: listings.map((listing, i) => ({
      ...listing,
      status: "listed",
      sellerId: sellerIds[i % sellerIds.length],
    })),
  });

  console.log(`Seeded ${listings.length} listings across ${SELLERS.length} seller accounts.`);
  console.log(`Test accounts: ${[...SELLERS, BUYER].join(", ")} (password: ${TEST_PASSWORD})`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());