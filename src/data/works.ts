export type Work = {
  id: number;
  title: string;
  category: string;
  year: string;
  description: string;
  services: string[];
  mediaType: 'video' | 'image';
  src: string;
  poster: string;
};

export const works: Work[] = [
  {
    id: 1,
    title: 'Nomada',
    category: 'Web Platform',
    year: '7 - 2025',
    description: 'A visually immersive platform designed to elevate the creative workflow. Nomada merges a minimalist, gallery-style aesthetic with robust functionality, featuring a smart algorithm that curates high-fidelity assets based on your interactions.',
    services: ['UX UI Design', 'Full Stack Development', 'Product Design'],
    mediaType: 'video',
    src: 'https://res.cloudinary.com/dfedae5mn/video/upload/v1768811792/nomada_ggjy78.mov',
    poster: 'https://res.cloudinary.com/dfedae5mn/video/upload/so_5,f_jpg,q_90/v1768811792/nomada_ggjy78.jpg',
  },
  {
    id: 3,
    title: 'Lumina',
    category: 'E-commerce',
    year: '05 - 2025',
    description: 'A minimalist furniture e-commerce experience designed as an interactive portfolio. It features a physics-enabled 3D environment and a dynamic gallery sphere that reacts fluidly to cursor interactions, redefining digital product showcasing.',
    services: ['UX UI Design', 'Ecommerce', 'Full Stack Development', '3d interactions'],
    mediaType: 'video',
    src: 'https://res.cloudinary.com/dfedae5mn/video/upload/v1768812462/Lumina_sd7xhc.mp4',
    poster: 'https://res.cloudinary.com/dfedae5mn/video/upload/so_5,f_jpg,q_90/v1768812462/Lumina_sd7xhc.jpg',
  },
];
