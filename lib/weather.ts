import type { WeatherData } from "@/types/weather";

async function requestWeather(params: URLSearchParams): Promise<WeatherData> {
  const queryString = params.toString();
  const response = await fetch(`/api/weather?${queryString}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch weather data");
  }

  return response.json();
}

export async function getWeatherByQuery(query: string): Promise<WeatherData> {
  const params = new URLSearchParams({
    q: query,
  });

  return requestWeather(params);
}

interface CoordinateRequest {
  lat: number;
  lon: number;
  name?: string;
  region?: string;
  country?: string;
}

export async function getWeatherByCoordinates({
  lat,
  lon,
  name,
  region,
  country,
}: CoordinateRequest): Promise<WeatherData> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  if (name) params.append("name", name);
  if (region) params.append("region", region);
  if (country) params.append("country", country);

  return requestWeather(params);
}

export async function getWeather(query: string): Promise<WeatherData> {
  return getWeatherByQuery(query);
}
