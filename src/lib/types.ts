export type PostKind = 'video' | 'photo' | 'quiz';

export type PostTheme = 
  | 'arquitetura'
  | 'arte' 
  | 'artesanato' 
  | 'astronomia'
  | 'biologia'
  | 'carreira'
  | 'ciencia'
  | 'computadores' 
  | 'culinaria'
  | 'danca'
  | 'desenho' 
  | 'design'
  | 'desenvolvimento-pessoal'
  | 'direito'
  | 'economia'
  | 'educacao'
  | 'empreendedorismo'
  | 'engenharia'
  | 'escrita'
  | 'espiritualidade'
  | 'esportes'
  | 'familia'
  | 'filmes' 
  | 'filosofia'
  | 'financas'
  | 'fisica'
  | 'fotografia'
  | 'historia'
  | 'idiomas'
  | 'jogos'
  | 'leitura'
  | 'lideranca'
  | 'marketing'
  | 'matematica'
  | 'meditacao'
  | 'meio-ambiente'
  | 'moda'
  | 'musculacao' 
  | 'musica'
  | 'negocios'
  | 'nutrição'
  | 'outros'
  | 'politica'
  | 'produtividade'
  | 'programacao' 
  | 'psicologia'
  | 'quimica'
  | 'relacionamentos'
  | 'saude'
  | 'sociologia'
  | 'sustentabilidade'
  | 'teatro'
  | 'tecnologia' 
  | 'vendas'
  | 'viagem'
  | 'voluntariado'
  | 'yoga';

export type QuizTheme = PostTheme;

export type QuizDuration = 12 | 24 | 36 | 48;

export type Theme = 'Carreira' | 'Saúde' | 'Finanças' | 'Fé' | 'Estudos' | 'Outros';

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  streakDays: number;
  lastActiveDate?: Date;
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string];
  correctIndex: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  pinned?: boolean;
}

export interface QuizAnswer {
  userId: string;
  answers: number[];
  answeredAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  theme: Theme;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  isActive?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  kind: PostKind;
  createdAt: Date;
  theme: PostTheme;
  
  // Para vídeos e fotos
  mediaUrl?: string;
  caption?: string;
  musicUrl?: string; // Nova propriedade para música
  
  // Para questionários
  quizTheme?: QuizTheme;
  quizQuestions?: QuizQuestion[];
  quizDuration?: QuizDuration;
  quizClosesAt?: Date;
  quizAnswers?: QuizAnswer[];
  
  // Métricas e interações
  likes: number;
  likedBy: string[];
  points: number;
  donatedBy: string[];
  comments?: Comment[];
}

export interface UserPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number;
}
