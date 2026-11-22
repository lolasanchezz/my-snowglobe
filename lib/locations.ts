export interface Location {
	name: string;
	address: string;
}

// From the Snowglobe Attendee Guide (Canva).
export const LOCATIONS = {
	notion: { name: "Notion HQ", address: "20 Annie St, San Francisco, CA 94105" },
	hostel: { name: "HI Hostel", address: "312 Mason St, San Francisco, CA 94102" },
	airport: { name: "SFO", address: "780 S Airport Blvd, San Francisco, CA 94128" },
} satisfies Record<string, Location>;

export function mapsUrl(location: Location): string {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
}
