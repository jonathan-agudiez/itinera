export function canPermanentlyDeleteItinerary(ownerId: string, actorUserId: string): boolean {
  return ownerId === actorUserId;
}

export function canHideItineraryFromPortfolio(ownerId: string, actorUserId: string): boolean {
  return ownerId !== actorUserId;
}
