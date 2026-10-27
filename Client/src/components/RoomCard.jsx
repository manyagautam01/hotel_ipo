import { Users, Hash } from 'lucide-react';
import RoomImage from './RoomImage.jsx';
import { money } from '../utils/format.js';

export default function RoomCard({ room, onBook, actionLabel = 'Book this room' }) {
  return (
    <article className="room-card">
      <div className="room-media">
        <RoomImage src={room.image} alt={`${room.type} room ${room.roomNumber}`} />
        <span className="room-type">{room.type}</span>
      </div>
      <div className="room-body">
        <div className="room-meta">
          <span><Hash size={14} /> Room {room.roomNumber}</span>
          <span><Users size={14} /> Sleeps {room.capacity}</span>
        </div>
        <p className="room-desc">{room.description}</p>
        <div className="room-foot">
          <div className="room-price">
            <strong>{money(room.price)}</strong> <span>/ night</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onBook(room)}>{actionLabel}</button>
        </div>
      </div>
    </article>
  );
}
