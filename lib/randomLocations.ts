const RANDOM_LOCATIONS = [
  "Reykjavik",
  "Bergen",
  "Edinburgh",
  "Dublin",
  "London",
  "San Francisco",
  "Seattle",
  "Chicago",
  "New York City",
  "Tampa",
  "Oklahoma City",
  "Phoenix",
  "San Diego",
  "Miami Beach",
  "Honolulu",
  "Hilo",
  "Vancouver",
  "Quebec",
  "Mexico City",
  "Cancun",
  "Rio de Janeiro",
  "Manaus",
  "Quito",
  "La Paz",
  "Cape Town",
  "Marrakech",
  "Mumbai",
  "Bangkok",
  "Sapporo",
];

export function getRandomLocation(current?: string): string {
  const trimmedCurrent = current?.trim().toLowerCase();
  const candidates = RANDOM_LOCATIONS.filter(
    (location) => location.toLowerCase() !== trimmedCurrent
  );

  const pool = candidates.length > 0 ? candidates : RANDOM_LOCATIONS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export function getRandomLocationList(): readonly string[] {
  return RANDOM_LOCATIONS;
}
