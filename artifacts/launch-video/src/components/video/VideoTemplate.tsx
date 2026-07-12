import { useEffect } from 'react';

import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene1Intro } from './video_scenes/Scene1Intro';
import { Scene2Flights } from './video_scenes/Scene2Flights';
import { Scene3Visas } from './video_scenes/Scene3Visas';
import { Scene4Packages } from './video_scenes/Scene4Packages';
import { Scene5Tickets } from './video_scenes/Scene5Tickets';
import { Scene6Outro } from './video_scenes/Scene6Outro';

export const SCENE_DURATIONS = {
  intro: 4500,
  flights: 5000,
  visas: 5000,
  packages: 5000,
  tickets: 5000,
  outro: 6000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1Intro,
  flights: Scene2Flights,
  visas: Scene3Visas,
  packages: Scene4Packages,
  tickets: Scene5Tickets,
  outro: Scene6Outro,
};

function PersistentElements({ currentScene }: { currentScene: number }) {
  const isContentScene = currentScene >= 1 && currentScene <= 4;

  return (
    <>
      {/* Background gradients */}
      <motion.div
        className="absolute top-0 left-0 w-[150vw] h-[150vw] rounded-full mix-blend-screen pointer-events-none opacity-30 blur-[120px] z-10"
        animate={{
          background: isContentScene
            ? 'radial-gradient(circle, var(--color-primary) 0%, transparent 60%)'
            : 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
          x: currentScene === 0 ? '-50vw' : currentScene === 5 ? '50vw' : '10vw',
          y: currentScene === 0 ? '-50vh' : currentScene === 5 ? '10vh' : '-20vh',
          scale: isContentScene ? 1.2 : 1,
        }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[100vw] h-[100vw] rounded-full mix-blend-screen pointer-events-none opacity-20 blur-[100px] z-10"
        animate={{
          background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 60%)',
          x: isContentScene ? '20vw' : '40vw',
          y: isContentScene ? '20vh' : '40vh',
        }}
        transition={{ duration: 3, ease: 'easeInOut' }}
      />

      {/* Persistent Logo for scenes 2-5 */}
      <motion.div
        className="absolute top-8 right-12 z-50 flex items-center gap-4 dir-rtl"
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: isContentScene ? 1 : 0,
          y: isContentScene ? 0 : -20,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ direction: 'rtl' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/qema-logo.png`}
          alt="Qema Logo"
          className="w-14 h-14 object-contain drop-shadow-lg"
        />
        <div className="flex flex-col text-right">
          <span className="ar-text text-white font-bold text-xl leading-tight drop-shadow-md">قمة النظائر</span>
          <span className="en-text text-[var(--color-primary)] text-xs tracking-[0.2em] uppercase font-bold drop-shadow-md">Travel & Tourism</span>
        </div>
      </motion.div>
    </>
  );
}

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(
    /_r[12]$/,
    '',
  ) as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-dark)' }}
    >
      <div className="bg-noise" />
      <PersistentElements currentScene={sceneIndex} />

      {/* mode="sync" allows crossfade and smooth overlapping transformations */}
      <AnimatePresence mode="sync">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
