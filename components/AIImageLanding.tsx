import React from 'react';
import { User, GeneratedImage } from '../types';
import { Generator } from './Generator';

interface AIImageLandingProps {
  user: User | null;
  onStartCreating: () => void;
  onLoginClick: () => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey: () => void;
  gallery?: GeneratedImage[];
  onCreditUsed?: () => void;
  onUpgradeRequired?: () => void;
  onImageGenerated?: (image: GeneratedImage) => void;
  onDeleteImage?: (id: string) => void;
  onUpdateUser?: (user: User) => void;
}

export const AIImageLanding: React.FC<AIImageLandingProps> = (props) => {
  return (
    <Generator
      user={props.user}
      gallery={props.gallery || []}
      onCreditUsed={props.onCreditUsed || (() => {})}
      onUpgradeRequired={props.onUpgradeRequired || (() => {})}
      onImageGenerated={props.onImageGenerated || (() => {})}
      onDeleteImage={props.onDeleteImage}
      onUpdateUser={props.onUpdateUser}
      hasApiKey={props.hasApiKey}
      onSelectKey={props.onSelectKey}
      onResetKey={props.onResetKey}
      onLoginClick={props.onLoginClick}
    />
  );
};