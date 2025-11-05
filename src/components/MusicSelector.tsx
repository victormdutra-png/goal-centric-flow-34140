import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Music {
  id: string;
  name: string;
  artist: string;
}

// Músicas em alta (simulação)
const trendingMusic: Music[] = [
  { id: "1", name: "Espelho", artist: "Luísa Sonza" },
  { id: "2", name: "Flowers", artist: "Miley Cyrus" },
  { id: "3", name: "As It Was", artist: "Harry Styles" },
  { id: "4", name: "Anti-Hero", artist: "Taylor Swift" },
  { id: "5", name: "Calm Down", artist: "Rema & Selena Gomez" },
  { id: "6", name: "Unholy", artist: "Sam Smith & Kim Petras" },
  { id: "7", name: "Players", artist: "Coi Leray" },
  { id: "8", name: "Dance The Night", artist: "Dua Lipa" },
  { id: "9", "name": "Kill Bill", artist: "SZA" },
  { id: "10", name: "Nosso Quadro", artist: "AnaVitória" },
];

interface MusicSelectorProps {
  onSelect: (music: { id: string; name: string }) => void;
  selectedMusic?: { id: string; name: string } | null;
}

export const MusicSelector = ({ onSelect, selectedMusic }: MusicSelectorProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredMusic = trendingMusic.filter(
    (music) =>
      music.name.toLowerCase().includes(search.toLowerCase()) ||
      music.artist.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (music: Music) => {
    onSelect({ id: music.id, name: `${music.name} - ${music.artist}` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Music className="mr-2 h-4 w-4" />
          {selectedMusic ? selectedMusic.name : "Adicionar Música"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Músicas em Alta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Buscar música ou artista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredMusic.map((music) => (
                <button
                  key={music.id}
                  onClick={() => handleSelect(music)}
                  className="w-full p-3 text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium">{music.name}</p>
                  <p className="text-sm text-muted-foreground">{music.artist}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
