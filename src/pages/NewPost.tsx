import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { PostKind, PostTheme, QuizTheme, QuizDuration, QuizQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/Header';
import { ArrowLeft, Video, Camera, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MentionInput } from '@/components/MentionInput';
import { processMentions } from '@/lib/mentions';
import { useAuth } from '@/contexts/AuthContext';
import { postContentSchema, quizSchema, validateFileUpload } from '@/lib/validation';
import { logger } from '@/lib/logger';

const QUIZ_THEMES: { value: QuizTheme; label: string }[] = [
  { value: 'arquitetura', label: 'Arquitetura' },
  { value: 'arte', label: 'Arte' },
  { value: 'artesanato', label: 'Artesanato' },
  { value: 'astronomia', label: 'Astronomia' },
  { value: 'biologia', label: 'Biologia' },
  { value: 'carreira', label: 'Carreira' },
  { value: 'ciencia', label: 'Ciência' },
  { value: 'computadores', label: 'Computadores' },
  { value: 'culinaria', label: 'Culinária' },
  { value: 'danca', label: 'Dança' },
  { value: 'desenho', label: 'Desenho' },
  { value: 'design', label: 'Design' },
  { value: 'desenvolvimento-pessoal', label: 'Desenvolvimento Pessoal' },
  { value: 'direito', label: 'Direito' },
  { value: 'economia', label: 'Economia' },
  { value: 'educacao', label: 'Educação' },
  { value: 'empreendedorismo', label: 'Empreendedorismo' },
  { value: 'engenharia', label: 'Engenharia' },
  { value: 'escrita', label: 'Escrita' },
  { value: 'espiritualidade', label: 'Espiritualidade' },
  { value: 'esportes', label: 'Esportes' },
  { value: 'familia', label: 'Família' },
  { value: 'filmes', label: 'Filmes' },
  { value: 'filosofia', label: 'Filosofia' },
  { value: 'financas', label: 'Finanças' },
  { value: 'fisica', label: 'Física' },
  { value: 'fotografia', label: 'Fotografia' },
  { value: 'historia', label: 'História' },
  { value: 'idiomas', label: 'Idiomas' },
  { value: 'jogos', label: 'Jogos' },
  { value: 'leitura', label: 'Leitura' },
  { value: 'lideranca', label: 'Liderança' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'matematica', label: 'Matemática' },
  { value: 'meditacao', label: 'Meditação' },
  { value: 'meio-ambiente', label: 'Meio Ambiente' },
  { value: 'moda', label: 'Moda' },
  { value: 'musculacao', label: 'Musculação' },
  { value: 'musica', label: 'Música' },
  { value: 'negocios', label: 'Negócios' },
  { value: 'nutrição', label: 'Nutrição' },
  { value: 'outros', label: 'Outros' },
  { value: 'politica', label: 'Política' },
  { value: 'produtividade', label: 'Produtividade' },
  { value: 'programacao', label: 'Programação' },
  { value: 'psicologia', label: 'Psicologia' },
  { value: 'quimica', label: 'Química' },
  { value: 'relacionamentos', label: 'Relacionamentos' },
  { value: 'saude', label: 'Saúde' },
  { value: 'sociologia', label: 'Sociologia' },
  { value: 'sustentabilidade', label: 'Sustentabilidade' },
  { value: 'teatro', label: 'Teatro' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'viagem', label: 'Viagem' },
  { value: 'voluntariado', label: 'Voluntariado' },
  { value: 'yoga', label: 'Yoga' },
];

export default function NewPost() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { addPost } = useAppStore();
  
  const [postType, setPostType] = useState<PostKind | null>(null);
  
  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [postTheme, setPostTheme] = useState<PostTheme>('tecnologia');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicPreview, setMusicPreview] = useState<string>('');
  
  // Quiz state
  const [addQuiz, setAddQuiz] = useState(false);
  const [quizTheme, setQuizTheme] = useState<QuizTheme>('tecnologia');
  const [quizDuration, setQuizDuration] = useState<QuizDuration>(24);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', ''], correctIndex: 0 },
    { question: '', options: ['', '', ''], correctIndex: 0 }
  ]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const validation = validateFileUpload(
        file,
        10 * 1024 * 1024, // 10MB max for media
        postType === 'video' 
          ? ['video/mp4', 'video/quicktime', 'video/webm']
          : ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      );
      
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMusicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMusicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMusicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addQuestion = () => {
    if (questions.length < 3) {
      setQuestions([...questions, { question: '', options: ['', '', ''], correctIndex: 0 }]);
    }
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 2) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[qIndex].options] as [string, string, string];
    newOptions[optIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!postType) {
      toast.error('Selecione o tipo de publicação');
      return;
    }

    if (!authUser?.id) {
      toast.error('Você precisa estar logado para criar posts');
      return;
    }

    if (postType === 'video' || postType === 'photo') {
      if (!mediaFile) {
        toast.error('Adicione uma mídia');
        return;
      }

      // If media with quiz, validate quiz
      if (addQuiz) {
        if (questions.length < 2) {
          toast.error('O questionário deve ter no mínimo 2 questões');
          return;
        }
        
        // Validate each question with Zod
        for (const question of questions) {
          try {
            quizSchema.parse(question);
          } catch (error: any) {
            const message = error.errors?.[0]?.message || 'Erro na validação do questionário';
            toast.error(message);
            logger.warn('Quiz validation failed', { error, question });
            return;
          }
        }

        const closesAt = new Date();
        closesAt.setHours(closesAt.getHours() + quizDuration);

        const postId = `p${Date.now()}`;
        const newPost = {
          id: postId,
          userId: authUser.id,
          kind: postType,
          theme: postTheme,
          mediaUrl: mediaPreview,
          caption: caption.trim() || undefined,
          musicUrl: musicPreview || undefined,
          quizTheme,
          quizQuestions: questions,
          quizDuration,
          quizClosesAt: closesAt,
          quizAnswers: [],
          createdAt: new Date(),
          likes: 0,
          likedBy: [],
          points: 0,
          donatedBy: [],
          comments: [],
        };

        addPost(newPost);
        
        // Process mentions asynchronously (non-blocking)
        if (caption.trim()) {
          processMentions(caption, authUser.id, postId).catch((error) => {
            logger.error('Failed to process mentions', error, { postId });
          });
        }
        
        toast.success(postType === 'video' ? 'Vídeo com questionário publicado!' : 'Foto com questionário publicada!');
        navigate('/');
        return;
      }

      const postId = `p${Date.now()}`;
      const newPost = {
        id: postId,
        userId: authUser.id,
        kind: postType,
        theme: postTheme,
        mediaUrl: mediaPreview,
        caption: caption.trim() || undefined,
        musicUrl: musicPreview || undefined,
        createdAt: new Date(),
        likes: 0,
        likedBy: [],
        points: 0,
        donatedBy: [],
        comments: [],
      };

      addPost(newPost);
      
      // Process mentions asynchronously (non-blocking)
      if (caption.trim()) {
        processMentions(caption, authUser.id, postId).catch((error) => {
          logger.error('Failed to process mentions', error, { postId });
        });
      }
      
      toast.success('Publicado com sucesso!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-[420px] mx-auto">
        <Header />
        
        {/* Subheader */}
        <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-[73px] z-30">
          <div className="flex items-center gap-3">
            {postType && (
              <Button variant="ghost" size="sm" onClick={() => setPostType(null)} className="h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {!postType && (
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {!postType ? 'Escolha o tipo de publicação' : 'Nova Publicação'}
              </h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="px-4 py-6">
          {!postType ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
                onClick={() => setPostType('video')}
              >
                <Video className="w-6 h-6" />
                <span>Adicionar Vídeo</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
                onClick={() => setPostType('photo')}
              >
                <Camera className="w-6 h-6" />
                <span>Adicionar Foto</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Theme Selection */}
              <div className="space-y-2">
                <Label htmlFor="post-theme">Tema da Publicação *</Label>
                <Select value={postTheme} onValueChange={(v) => setPostTheme(v as PostTheme)}>
                  <SelectTrigger id="post-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUIZ_THEMES.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Media Upload */}
              {(postType === 'video' || postType === 'photo') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="media">
                      {postType === 'video' ? 'Vídeo' : 'Foto'} *
                    </Label>
                    {!mediaPreview && (
                      <Input
                        id="media"
                        type="file"
                        accept={postType === 'video' ? 'video/*' : 'image/*'}
                        onChange={handleMediaSelect}
                        capture={postType === 'photo' ? 'environment' : undefined}
                      />
                    )}
                    {mediaPreview && (
                      <div className="mt-3 rounded-lg overflow-hidden relative">
                        {postType === 'photo' ? (
                          <img src={mediaPreview} alt="Preview" className="w-full" />
                        ) : (
                          <video src={mediaPreview} controls className="w-full" />
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setMediaFile(null);
                            setMediaPreview('');
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption">Legenda (opcional)</Label>
                    <MentionInput
                      value={caption}
                      onChange={setCaption}
                      placeholder="Adicione uma legenda... (use @ para mencionar)"
                      className="min-h-[80px]"
                      maxLength={500}
                    />
                  </div>

                  {/* Music Upload - Only for photos */}
                  {postType === 'photo' && (
                    <div className="space-y-2">
                      <Label htmlFor="music">Música de fundo (opcional)</Label>
                      {!musicPreview && (
                        <Input
                          id="music"
                          type="file"
                          accept="audio/*"
                          onChange={handleMusicSelect}
                        />
                      )}
                      {musicPreview && (
                        <div className="mt-2 relative">
                          <audio src={musicPreview} controls className="w-full" />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="absolute -top-1 right-0"
                            onClick={() => {
                              setMusicFile(null);
                              setMusicPreview('');
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Quiz Option */}
                  <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                    <input
                      type="checkbox"
                      id="add-quiz"
                      checked={addQuiz}
                      onChange={(e) => setAddQuiz(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="add-quiz" className="cursor-pointer">
                      Adicionar questionário sobre este conteúdo
                    </Label>
                  </div>
                </>
              )}

              {/* Quiz Form */}
              {addQuiz && (postType === 'video' || postType === 'photo') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração do Questionário *</Label>
                    <Select value={String(quizDuration)} onValueChange={(v) => setQuizDuration(Number(v) as QuizDuration)}>
                      <SelectTrigger id="duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 horas</SelectItem>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="36">36 horas</SelectItem>
                        <SelectItem value="48">48 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Questões (2-3 obrigatórias) *</Label>
                      {questions.length < 3 && (
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar 3ª questão
                        </Button>
                      )}
                    </div>

                    {questions.map((q, qIdx) => (
                      <div key={qIdx} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Questão {qIdx + 1}</span>
                          {questions.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(qIdx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <Input
                          placeholder="Digite a pergunta"
                          value={q.question}
                          onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                          maxLength={200}
                        />

                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={q.correctIndex === optIdx}
                                onChange={() => updateQuestion(qIdx, 'correctIndex', optIdx)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                              />
                              <Input
                                placeholder={`Opção ${optIdx + 1}`}
                                value={opt}
                                onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                maxLength={100}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs font-semibold text-primary">
                          ✓ Marque a opção correta clicando no círculo
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                Publicar
              </Button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
