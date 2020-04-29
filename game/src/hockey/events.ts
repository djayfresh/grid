import { SocketEvent } from '../shared/events';
import { BaseEvent } from '../shared/event-queue';
import { IPoint } from '../shared/physics';

@SocketEvent('Event.Player.Connected')
export class PlayerConnectedEvent extends BaseEvent<{playerId: string, nickname?: string}> {}

@SocketEvent('Event.Create.Lobby')
export class CreateLobbyEvent extends BaseEvent<{gameId: number}> {}

@SocketEvent('Event.Lobby.Created')
export class LobbyCreatedEvent extends BaseEvent<{lobbyId: string, name?: string}> {}

@SocketEvent('Event.Player.Joined')
export class PlayerJoinedEvent extends BaseEvent<{lobbyId: string, playerId: string}> {}

@SocketEvent('Event.Player.Moved')
export class PlayerMovedEvent extends BaseEvent<{lobbyId: string, playerId: string, pos: IPoint}> {}