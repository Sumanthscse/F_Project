import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import io from 'socket.io-client';

const socket = io("http://YOUR_SERVER_IP:5000");

interface Pos { lat:number; lng:number; truck:string }

export function LiveMap() {
  const [positions, setPositions] = useState<Pos[]>([]);

  useEffect(() => {
    socket.on('telemetry', (data:any) => {
      setPositions(prev => [...prev, { lat:data.lat, lng:data.lng, truck:data.truckNumber }].slice(-500));
    });
    return () => { socket.off('telemetry'); };
  }, []);

  const last = positions.at(-1);

  return (
    <div style={{ height:'600px', width:'100%' }}>
      <MapContainer center={last?[last.lat,last.lng]:[20.5,78.9]} zoom={6} style={{height:'100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {last && <Marker position={[last.lat,last.lng]} />}
        {positions.length>1 && <Polyline positions={positions.map(p=>[p.lat,p.lng])} />}
      </MapContainer>
    </div>
  );
}
