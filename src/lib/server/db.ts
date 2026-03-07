import {
	InMemoryClubRepository,
	InMemoryPlayerRepository,
	InMemorySeasonRepository,
	InMemoryMatchRepository,
	InMemoryStandingsService
} from './memory-repository.js';
import { seedClubs, seedPlayers, seedSeasons, seedSeasonClubs, seedMatches } from './seed.js';

export const clubRepo = new InMemoryClubRepository(seedClubs);
export const playerRepo = new InMemoryPlayerRepository(seedPlayers);
export const seasonRepo = new InMemorySeasonRepository(seedSeasons, seedSeasonClubs);
export const matchRepo = new InMemoryMatchRepository(seedMatches);
export const standingsService = new InMemoryStandingsService(matchRepo, seasonRepo, clubRepo);
