import axios from "axios";
import { env } from "../config/env";

export type PlaceSuggestion = {
  placeId: string;
  name: string;
  label: string;
  latitude: number;
  longitude: number;
};

type GeoapifyFeature = {
  properties?: {
    place_id?: string;
    name?: string;
    formatted?: string;
    lat?: number;
    lon?: number;
  };
};

export const autocompletePlaces = async (text: string) => {
  if (!env.GEOAPIFY_API_KEY) {
    throw new Error("GEOAPIFY_API_KEY is not configured");
  }

  const response = await axios.get("https://api.geoapify.com/v1/geocode/autocomplete", {
    params: {
      text,
      apiKey: env.GEOAPIFY_API_KEY,
      format: "json",
      filter: "countrycode:in",
      lang: "en",
      limit: 10,
    },
    timeout: 10000,
  });

  const rawItems = (response.data?.features ?? response.data?.results ?? []) as Array<
    GeoapifyFeature | GeoapifyFeature["properties"]
  >;

  return rawItems
    .map((item, index) => {
      const props =
        item && typeof item === "object" && "properties" in item && item.properties
          ? item.properties
          : (item as GeoapifyFeature["properties"]) ?? {};
      const lat = props.lat;
      const lon = props.lon;
      if (lat == null || lon == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) {
        return null;
      }
      const label = props.formatted?.trim() || props.name?.trim() || "";
      const name = props.name?.trim() || label;
      if (!label) {
        return null;
      }
      return {
        placeId: props.place_id || `geoapify-${index}`,
        name,
        label,
        latitude: Number(lat),
        longitude: Number(lon),
      } satisfies PlaceSuggestion;
    })
    .filter((item): item is PlaceSuggestion => item != null);
};

