import axios from "axios";
import { env } from "../config/env";

const GOOGLE_PLACES_KEY = env.GOOGLE_PLACES_KEY;
const GOOGLE_GEOCODE_KEY = env.GOOGLE_GEOCODE_KEY;

export const searchPlaces = async (query: string) => {
  if (!GOOGLE_PLACES_KEY) {
    throw new Error("GOOGLE_PLACES_KEY is not configured");
  }

  const url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";

  const response = await axios.get(url, {
    params: {
      input: query,
      components: "country:in",
      key: GOOGLE_PLACES_KEY,
    },
  });

  const predictions = response.data?.predictions ?? [];
  const results = predictions.map((place: any) => ({
    mainText: place?.structured_formatting?.main_text,
    secondaryText: place?.structured_formatting?.secondary_text,
  }));

  return { success: true, results };
};

export const getGeolocation = async (address: string) => {
  if (!GOOGLE_GEOCODE_KEY) {
    throw new Error("GOOGLE_GEOCODE_KEY is not configured");
  }

console.log('GOOGLE_GEOCODE_KEY', GOOGLE_GEOCODE_KEY)


  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  const response = await axios.get(url, {
    params: {
      address,
      key: GOOGLE_GEOCODE_KEY,
    },
  });

  const status = response.data?.status;
  const errorMessage = response.data?.error_message;
  if (status && status !== "OK") {
    if (status === "ZERO_RESULTS") {
      throw new Error("No results from Google Geocoder");
    }
    throw new Error(errorMessage || `Google Geocoder error: ${status}`);
  }

  const results = response.data?.results ?? [];
  if (results.length === 0) {
    throw new Error("No results from Google Geocoder");
  }

  const result = results[0];
  const latitude = result.geometry.location.lat;
  const longitude = result.geometry.location.lng;

  return {
    latitude,
    longitude,
    formattedAddress: result.formatted_address,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  };
};

