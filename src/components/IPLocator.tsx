import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GithubIcon, AlertCircle, Star } from 'lucide-react';

// Fix Leaflet's default icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  latitude: number;
  longitude: number;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function IPLocator() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [domainIP, setDomainIP] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [visitorCount, setVisitorCount] = useState(0);
  const mapRef = useRef<L.Map | null>(null);

  const fetchLocationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://ipapi.co/json/');
      const data = response.data;
      if (data.error) {
        throw new Error(data.reason || 'Failed to fetch location data');
      }
      setLocationData(data);
      setMapCenter([data.latitude, data.longitude]);
      setMapZoom(13);
      incrementVisitorCount();
    } catch (error) {
      console.error('Error fetching location data:', error);
      setError('Failed to fetch location data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const lookupDomainIP = async () => {
    try {
      const response = await axios.get(`https://dns.google/resolve?name=${domainInput}`);
      const ip = response.data.Answer[0].data;
      setDomainIP(ip);
    } catch (error) {
      console.error('Error looking up domain IP:', error);
      setDomainIP('Failed to lookup domain IP');
    }
  };

  const incrementVisitorCount = async () => {
    try {
      const response = await axios.post('/api/incrementVisitorCount');
      setVisitorCount(response.data.count);
    } catch (error) {
      console.error('Error incrementing visitor count:', error);
    }
  };

  const fetchVisitorCount = async () => {
    try {
      const response = await axios.get('/api/getVisitorCount');
      setVisitorCount(response.data.count);
    } catch (error) {
      console.error('Error fetching visitor count:', error);
    }
  };

  useEffect(() => {
    fetchLocationData();
    fetchVisitorCount();
  }, []);

  return (
    <>
      <div className="max-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="container mx-auto p-4">
          <main className="">
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Find Your IP</CardTitle>
                <CardDescription>View your IP address and location information</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ip-locator" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ip-locator">IP Locator</TabsTrigger>
                    <TabsTrigger value="domain-lookup">Domain Lookup</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ip-locator">
                    <div className="mb-4">
                      {loading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ) : error ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ) : locationData ? (
                        <div className="space-y-2">
                          <p><strong>IP Address:</strong> {locationData.ip}</p>
                          <p><strong>City:</strong> {locationData.city}</p>
                          <p><strong>Region:</strong> {locationData.region}</p>
                          <p><strong>Country:</strong> {locationData.country_name}</p>
                        </div>
                      ) : null}
                    </div>
                    <Button onClick={fetchLocationData} className="mb-4">
                      {loading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                    {locationData && (
                      <div className="mt-2 h-[300px] w-full">
                        <MapContainer 
                          center={mapCenter}
                          zoom={mapZoom}
                          style={{ height: '100%', width: '100%' }}
                          ref={mapRef}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <Marker position={[locationData.latitude, locationData.longitude]}>
                            <Popup>
                              Your location
                            </Popup>
                          </Marker>
                          <MapUpdater center={mapCenter} zoom={mapZoom} />
                        </MapContainer>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="domain-lookup">
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          placeholder="Enter domain (e.g., google.com)"
                        />
                        <Button onClick={lookupDomainIP}>
                          Lookup
                        </Button>
                      </div>
                      {domainIP && (
                        <p className="mt-2">
                          <strong>Domain IP:</strong> {domainIP}
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>{visitorCount} IP addresses have been located</p>
        <p className="mt-2">
          Made with ❤️ 2024 by ifalfahri | 
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/ifalfahri/findyourip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center"
                >
                  <GithubIcon className="w-3 h-3 mr-1" />
                  GitHub
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <a href='https://github.com/ifalfahri/findyourip' target='_blank' rel='noopener noreferrer' className='flex items-center hover:underline'><Star className="w-4 h-4 mr-1" />Star it on GitHub!</a>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
      </footer>
    </>
  );
}