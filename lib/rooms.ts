import rooms from "./rooms.json";
import { allAttendees, type Attendee } from "./attendees";

// Snapshot of the "During the event" rooming plan in Attend
// (attend.hackclub.com/admin/events/snowglobe/rooming_wizard).
// Rooms Attend auto-created are named "Room <id>"; those don't have a real
// hostel room number yet, so we don't show the name.
export interface Room {
	/** Hostel room number/name, if one has been set in Attend. */
	label?: string;
	roommates: Attendee[];
}

const AUTO_NAME = /^Room [0-9a-f]{8}$/;

export function roomFor(attendee: Attendee): Room | undefined {
	const room = (rooms as { name: string; occupants: string[] }[]).find((r) => r.occupants.includes(attendee.attendId));
	if (!room) return undefined;
	const byId = new Map(allAttendees().map((a) => [a.attendId, a]));
	return {
		label: AUTO_NAME.test(room.name) ? undefined : room.name,
		roommates: room.occupants
			.filter((id) => id !== attendee.attendId)
			.map((id) => byId.get(id))
			.filter((a): a is Attendee => a !== undefined),
	};
}
