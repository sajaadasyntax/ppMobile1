import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

// Use the same base URL as the API
const SERVER_BASE_URL = 'http://10.0.2.2:5000'; // For Android emulator
// const SERVER_BASE_URL = 'http://localhost:5000'; // For iOS simulator
// const SERVER_BASE_URL = 'https://your-production-url.com'; // For production

type MessageHandler = (message: any) => void;
type ErrorHandler = (error: { message: string }) => void;
type ConnectHandler = () => void;
type DisconnectHandler = (reason: string) => void;

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private connectHandlers: Set<ConnectHandler> = new Set();
  private disconnectHandlers: Set<DisconnectHandler> = new Set();
  private currentRoomId: string | null = null;

  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }

    try {
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.warn('No auth token available for socket connection');
        return false;
      }

      this.socket = io(SERVER_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.setupEventListeners();

      return new Promise((resolve) => {
        this.socket!.on('connect', () => {
          console.log('Socket connected');
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message);
          resolve(false);
        });

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.socket?.connected) {
            console.warn('Socket connection timeout');
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket?.id);
      this.connectHandlers.forEach(handler => handler());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.disconnectHandlers.forEach(handler => handler(reason));
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      this.errorHandlers.forEach(handler => handler(error));
    });

    this.socket.on('new_message', (message: any) => {
      console.log('Received new message:', message.id);
      const handlers = this.messageHandlers.get(message.roomId);
      handlers?.forEach(handler => handler(message));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Join a chat room
  joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join room: Socket not connected');
      return;
    }

    // Leave previous room if different
    if (this.currentRoomId && this.currentRoomId !== roomId) {
      this.leaveRoom(this.currentRoomId);
    }

    this.socket.emit('join_room', roomId);
    this.currentRoomId = roomId;
    console.log('Joining room:', roomId);
  }

  // Leave a chat room
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('leave_room', roomId);
    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }
    console.log('Left room:', roomId);
  }

  // Send a message via socket (real-time)
  sendMessage(roomId: string, text: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send message: Socket not connected');
      return;
    }

    this.socket.emit('send_message', { roomId, text });
  }

  // Register a handler for new messages in a specific room
  onMessage(roomId: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(roomId)) {
      this.messageHandlers.set(roomId, new Set());
    }
    this.messageHandlers.get(roomId)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(roomId)?.delete(handler);
    };
  }

  // Register error handler
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  // Register connect handler
  onConnect(handler: ConnectHandler): () => void {
    this.connectHandlers.add(handler);
    return () => {
      this.connectHandlers.delete(handler);
    };
  }

  // Register disconnect handler
  onDisconnect(handler: DisconnectHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => {
      this.disconnectHandlers.delete(handler);
    };
  }

  // Clean up all handlers for a room
  removeRoomHandlers(roomId: string): void {
    this.messageHandlers.delete(roomId);
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

