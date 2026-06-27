import { describe, expect, it } from 'vitest';
import {
  canHideItineraryFromPortfolio,
  canPermanentlyDeleteItinerary,
} from '../src/services/itinerary-permissions.js';

describe('permisos de itinerarios', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const collaboratorId = '22222222-2222-4222-8222-222222222222';

  it('permite al propietario eliminar permanentemente su itinerario', () => {
    expect(canPermanentlyDeleteItinerary(ownerId, ownerId)).toBe(true);
  });

  it('impide a un colaborador eliminar el itinerario original', () => {
    expect(canPermanentlyDeleteItinerary(ownerId, collaboratorId)).toBe(false);
  });

  it('permite a un colaborador ocultar el itinerario de su portfolio', () => {
    expect(canHideItineraryFromPortfolio(ownerId, collaboratorId)).toBe(true);
  });

  it('impide al propietario ocultar su propio itinerario', () => {
    expect(canHideItineraryFromPortfolio(ownerId, ownerId)).toBe(false);
  });
});
