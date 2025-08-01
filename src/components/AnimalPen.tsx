import React from 'react';
import { Animal, PlayerAnimal } from '../types/game';

interface AnimalPenProps {
  animals: Animal[];
  playerAnimals: PlayerAnimal[];
  onCollect: (playerAnimalId: string) => void;
}

const AnimalPen: React.FC<AnimalPenProps> = ({ animals, playerAnimals, onCollect }) => {
  const getAnimalDetails = (animalId: string) => {
    return animals.find(a => a.id === animalId);
  };

  return (
    <div className="bg-yellow-100 border-4 border-yellow-300 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-yellow-800 mb-4">Animal Pen</h2>
      <div className="grid grid-cols-3 gap-4">
        {playerAnimals.map(pa => {
          const animal = getAnimalDetails(pa.animalId);
          if (!animal) return null;

          const now = new Date().getTime();
          const lastCollected = new Date(pa.lastCollectedAt).getTime();
          const productionTime = animal.productionTimeSeconds * 1000;
          const isReady = now - lastCollected >= productionTime;

          return (
            <div key={pa.id} className={`p-4 rounded-lg text-center transition-all duration-300 ${isReady ? 'bg-green-200 border-2 border-green-400' : 'bg-gray-200'}`}>
              <div className="text-5xl mb-2">{animal.emoji}</div>
              <div className="font-bold">{animal.name}</div>
              {isReady ? (
                <button 
                  onClick={() => onCollect(pa.id)}
                  className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow-md transform hover:scale-105 transition-transform duration-200"
                >
                  Collect {animal.productEmoji}
                </button>
              ) : (
                <div className="mt-2 text-sm text-gray-600">Ready in...</div> // Simple timer placeholder
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnimalPen;
