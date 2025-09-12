import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ListMusic,
  X,
  Repeat,
  Repeat1,
  Shuffle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { app } from "@/configs/app";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// Define types
export interface Song {
  id: string;
  name: string;
  artist: string;
  img: string;
  src: string;
  duration: number;
}

interface SongLoadingState {
  coverLoaded: boolean;
  audioLoaded: boolean;
}

interface MusicPlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  progress: number;
  currentTime: number;
  duration: number;
  repeatMode: "repeat" | "repeat_one" | "shuffle";
  volume: number;
  isLoading: boolean;
  songLoadingStates: Record<string, SongLoadingState>;
}

interface MusicPlayerContextType extends MusicPlayerState {
  songs: Song[];
  togglePlayPause: () => void;
  playPrevious: () => void;
  playNext: () => void;
  playSong: (songId: string) => void;
  toggleRepeatMode: () => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  updateSongLoadingState: (
    songId: string,
    updates: Partial<SongLoadingState>
  ) => void;
  loadSong: (song: Song) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};

const formatTime = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

interface MusicPlayerProviderProps {
  children: React.ReactNode;
  apiUrl: string;
  autoPlay?: boolean;
}

export function MusicPlayerProvider({
  children,
  apiUrl,
  autoPlay = false,
}: MusicPlayerProviderProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [state, setState] = useState<MusicPlayerState>({
    isPlaying: false,
    currentSong: null,
    progress: 0,
    currentTime: 0,
    duration: 0,
    repeatMode: "repeat",
    volume: 0.7,
    isLoading: true,
    songLoadingStates: {},
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isTouchingRef = useRef(false);
  const imageLoadRefs = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data && Array.isArray(data)) {
          setSongs(data);

          // Initialize loading states for all songs
          const initialLoadingStates: Record<string, SongLoadingState> = {};
          data.forEach((song) => {
            initialLoadingStates[song.id] = {
              coverLoaded: false,
              audioLoaded: false,
            };
          });

          setState((prev) => ({
            ...prev,
            currentSong: data[0] || null,
            duration: data[0]?.duration || 0,
            isLoading: false,
            songLoadingStates: initialLoadingStates,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch songs:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchSongs();
  }, [apiUrl]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
        progress: prev.duration ? (audio.currentTime / prev.duration) * 100 : 0,
      }));
    };

    const handleEnded = () => {
      if (state.repeatMode === "repeat_one") {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        playNext();
      }
    };

    const handleLoadedData = () => {
      setState((prev) => ({
        ...prev,
        currentTime: 0,
        progress: 0,
      }));

      // Mark audio as loaded for the current song
      if (state.currentSong) {
        updateSongLoadingState(state.currentSong.id, { audioLoaded: true });
      }
    };

    const handleCanPlayThrough = () => {
      // Mark audio as loaded for the current song
      if (state.currentSong) {
        updateSongLoadingState(state.currentSong.id, { audioLoaded: true });
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
    };
  }, [state.repeatMode, state.currentSong]);

  const loadSong = useCallback((song: Song) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.src = `/${song.src}`;

    // Reset audio loaded state for the new song
    updateSongLoadingState(song.id, { audioLoaded: false });

    // Preload the cover image for the song
    preloadCoverImage(song);

    audio.load();

    setState((prev) => ({
      ...prev,
      currentSong: song,
      duration: song.duration || 0,
    }));

    return audio;
  }, []);

  useEffect(() => {
    if (state.currentSong && audioRef.current) {
      const audio = loadSong(state.currentSong);

      // Always try to play when song changes if autoPlay is enabled OR if we were already playing
      if (audio && ((state.isPlaying && autoPlay) || state.isPlaying)) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Playback failed:", error);
            setState((prev) => ({ ...prev, isPlaying: false }));
          });
        }
      }
    }
  }, [state.currentSong, autoPlay, state.isPlaying, loadSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Playback failed:", error);
          setState((prev) => ({ ...prev, isPlaying: false }));
        });
      }
    } else {
      audio.pause();
    }
  }, [state.isPlaying]);

  const preloadCoverImage = (song: Song) => {
    const imgUrl = `/images/smooth/${song.img}`;

    // If we've already loaded this image, mark it as loaded
    if (imageLoadRefs.current[song.id]?.complete) {
      updateSongLoadingState(song.id, { coverLoaded: true });
      return;
    }

    // Create and load the image
    const img = new Image();
    img.onload = () => {
      updateSongLoadingState(song.id, { coverLoaded: true });
      imageLoadRefs.current[song.id] = img;
    };
    img.onerror = () => {
      console.error(`Failed to load cover image for ${song.name}`);
      updateSongLoadingState(song.id, { coverLoaded: true }); // Mark as loaded even if error to avoid infinite loading
    };
    img.src = imgUrl;
  };

  const updateSongLoadingState = useCallback(
    (songId: string, updates: Partial<SongLoadingState>) => {
      setState((prev) => ({
        ...prev,
        songLoadingStates: {
          ...prev.songLoadingStates,
          [songId]: {
            ...prev.songLoadingStates[songId],
            ...updates,
          },
        },
      }));
    },
    []
  );

  const togglePlayPause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const playPrevious = useCallback(() => {
    if (!state.currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex(
      (song) => song.id === state.currentSong?.id
    );
    const newIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
    setState((prev) => ({
      ...prev,
      currentSong: songs[newIndex],
      isPlaying: true, // Auto-play the previous song
    }));
  }, [state.currentSong, songs]);

  const playNext = useCallback(() => {
    if (!state.currentSong || songs.length === 0) return;

    if (state.repeatMode === "shuffle") {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * songs.length);
      } while (
        songs[randomIndex]?.id === state.currentSong?.id &&
        songs.length > 1
      );
      setState((prev) => ({
        ...prev,
        currentSong: songs[randomIndex],
        isPlaying: true, // Auto-play the next song
      }));
    } else {
      const currentIndex = songs.findIndex(
        (song) => song.id === state.currentSong?.id
      );
      const newIndex = currentIndex === songs.length - 1 ? 0 : currentIndex + 1;
      setState((prev) => ({
        ...prev,
        currentSong: songs[newIndex],
        isPlaying: true, // Auto-play the next song
      }));
    }
  }, [state.currentSong, state.repeatMode, songs]);

  const playSong = useCallback(
    (songId: string) => {
      const song = songs.find((s) => s.id === songId);
      if (song) {
        // Load the song first, then set it as current
        loadSong(song);
        setState((prev) => ({
          ...prev,
          currentSong: song,
          isPlaying: true, // Auto-play the selected song
        }));
      }
    },
    [songs, loadSong]
  );

  const toggleRepeatMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      repeatMode:
        prev.repeatMode === "repeat"
          ? "repeat_one"
          : prev.repeatMode === "repeat_one"
          ? "shuffle"
          : "repeat",
    }));
  }, []);

  const setProgress = useCallback(
    (progress: number) => {
      if (audioRef.current) {
        const newTime = (progress / 100) * state.duration;
        audioRef.current.currentTime = newTime;
        setState((prev) => ({
          ...prev,
          progress,
          currentTime: newTime,
        }));
      }
    },
    [state.duration]
  );

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setState((prev) => ({ ...prev, volume }));
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      songs,
      togglePlayPause,
      playPrevious,
      playNext,
      playSong,
      toggleRepeatMode,
      setProgress,
      setVolume,
      updateSongLoadingState,
      loadSong,
    }),
    [
      state,
      songs,
      togglePlayPause,
      playPrevious,
      playNext,
      playSong,
      toggleRepeatMode,
      setProgress,
      setVolume,
      updateSongLoadingState,
      loadSong,
    ]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} style={{ display: "none" }} />
    </MusicPlayerContext.Provider>
  );
}

interface MusicPlayerProps {
  apiUrl: string;
  autoPlay?: boolean;
}

export function MusicPlayer({ apiUrl, autoPlay = false }: MusicPlayerProps) {
  return (
    <MusicPlayerProvider apiUrl={apiUrl} autoPlay={autoPlay}>
      <MusicPlayerDrawer />
    </MusicPlayerProvider>
  );
}

function MusicPlayerDrawer() {
  const {
    isPlaying,
    currentSong,
    progress,
    currentTime,
    duration,
    repeatMode,
    songs,
    isLoading,
    songLoadingStates,
    togglePlayPause,
    playPrevious,
    playNext,
    playSong,
    toggleRepeatMode,
    setProgress,
    loadSong,
  } = useMusicPlayer();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const playlistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPlaylist && playlistRef.current && currentSong) {
      const currentSongElement = playlistRef.current.querySelector(
        `[data-song-id="${currentSong.id}"]`
      );
      if (currentSongElement) {
        currentSongElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [showPlaylist, currentSong]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const progressBarWidth = progressBar.clientWidth;
    const newProgress = (clickPosition / progressBarWidth) * 100;
    setProgress(newProgress);
  };

  const isSongLoading = (songId: string) => {
    const loadingState = songLoadingStates[songId];
    return (
      !loadingState || !loadingState.coverLoaded || !loadingState.audioLoaded
    );
  };

  const getSongLoadingProgress = (songId: string) => {
    const loadingState = songLoadingStates[songId];
    if (!loadingState) return 0;

    let progress = 0;
    if (loadingState.coverLoaded) progress += 50;
    if (loadingState.audioLoaded) progress += 50;

    return progress;
  };

  const handleSongClick = (song: Song) => {
    const isLoading = isSongLoading(song.id);

    if (isLoading) {
      // If the song is still loading, force load it
      loadSong(song);
    }

    // Play the song regardless of loading state
    playSong(song.id);
  };

  if (isLoading) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="icon" className="cursor-pointer">
            <Music className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm p-4">
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-6" />
            <div className="flex flex-col items-center mb-6">
              <Skeleton className="w-48 h-48 rounded-lg mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="mb-2 px-2.5">
              <Skeleton className="h-2 w-full rounded-full mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-full" />
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (!currentSong) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="icon" className="cursor-pointer">
            <Music className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm p-4 text-center">
            <p>No songs available</p>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const currentSongLoading = isSongLoading(currentSong.id);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer"
          aria-label="Open music player"
        >
          <Music className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-full">
        <div className="mx-auto w-full overflow-y-auto mt-4 p-2.5 pt-0 md:px-[15vw] lg:px-[25vw]">
          <DrawerHeader>
            <DrawerTitle>Music Player</DrawerTitle>
            <DrawerDescription>Enjoy your music collection</DrawerDescription>
          </DrawerHeader>

          <div className="p-4">
            <div className="flex flex-col items-center mb-6">
              <div className="w-48 h-48 rounded-lg overflow-hidden mb-4 audio-responsive relative">
                {currentSongLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <img
                  src={`/images/smooth/${currentSong.img}`}
                  alt={`Cover for ${currentSong.name} by ${currentSong.artist}`}
                  className={`w-full h-full object-cover ${
                    currentSongLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoad={() => {}}
                />
              </div>
              <h3 className="text-lg font-semibold">{currentSong.name}</h3>
              <p className="text-muted-foreground">{currentSong.artist}</p>

              {currentSongLoading && (
                <div className="w-full max-w-xs mt-2">
                  <Progress
                    value={getSongLoadingProgress(currentSong.id)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Loading song...
                  </p>
                </div>
              )}
            </div>

            <div className="mb-2">
              <div
                className="h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
                onClick={handleProgressClick}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-2.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={toggleRepeatMode}
                title={
                  repeatMode === "repeat"
                    ? "Playlist looped"
                    : repeatMode === "repeat_one"
                    ? "Song looped"
                    : "Playback shuffled"
                }
              >
                {repeatMode === "repeat" && <Repeat className="h-5 w-5" />}
                {repeatMode === "repeat_one" && <Repeat1 className="h-5 w-5" />}
                {repeatMode === "shuffle" && <Shuffle className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={playPrevious}
                aria-label="Previous song"
                disabled={currentSongLoading}
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                onClick={togglePlayPause}
                className="h-12 w-12 cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}
                disabled={currentSongLoading}
              >
                {currentSongLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={playNext}
                aria-label="Next song"
                className="cursor-pointer"
                disabled={currentSongLoading}
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={() => setShowPlaylist(!showPlaylist)}
                aria-label={showPlaylist ? "Hide playlist" : "Show playlist"}
              >
                <ListMusic className="h-5 w-5" />
              </Button>
            </div>

            {showPlaylist && (
              <div className="mt-6 border rounded-lg p-4">
                <div
                  className="max-h-60 flex flex-col gap-2 overflow-y-auto"
                  ref={playlistRef}
                >
                  {songs.map((song) => {
                    const isLoading = isSongLoading(song.id);

                    return (
                      <div
                        key={song.id}
                        data-song-id={song.id}
                        className={`p-2 rounded cursor-pointer relative ${
                          song.id === currentSong.id
                            ? "bg-muted"
                            : "hover:bg-muted/50"
                        } ${isLoading ? "opacity-70" : ""}`}
                        onClick={() => handleSongClick(song)}
                      >
                        <div className="font-medium">{song.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {song.artist}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default MusicPlayer;
