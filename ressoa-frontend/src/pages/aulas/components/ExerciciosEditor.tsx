import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Questao {
  numero: number;
  enunciado: string;
  alternativas: Array<{
    letra: string;
    texto: string;
    correta: boolean;
  }>;
  habilidade_bncc: string;
  nivel_bloom: string;
  explicacao: string;
}

interface Exercicios {
  questoes: Questao[];
}

interface ExerciciosEditorProps {
  exercicios: Exercicios;
  onSave: (exercicios: Exercicios | null) => void;
  isPending: boolean;
}

export function ExerciciosEditor({ exercicios, onSave, isPending }: ExerciciosEditorProps) {
  const [questoes, setQuestoes] = useState<Questao[]>(exercicios.questoes);
  const [errors, setErrors] = useState<string[]>([]);

  const updateQuestao = (idx: number, field: string, value: any) => {
    const updated = [...questoes];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestoes(updated);
    setErrors([]); // Clear errors on edit
  };

  const updateAlternativa = (qIdx: number, aIdx: number, field: string, value: any) => {
    const updated = [...questoes];
    const alternativas = [...updated[qIdx].alternativas];

    // Se está marcando como correta, desmarcar as outras
    if (field === 'correta' && value === true) {
      alternativas.forEach((alt, i) => {
        alt.correta = i === aIdx;
      });
    } else {
      alternativas[aIdx] = { ...alternativas[aIdx], [field]: value };
    }

    updated[qIdx].alternativas = alternativas;
    setQuestoes(updated);
    setErrors([]);
  };

  const validateAndSave = () => {
    const validationErrors: string[] = [];

    // Validar cada questão
    questoes.forEach((questao, idx) => {
      // Enunciado não vazio
      if (!questao.enunciado || questao.enunciado.trim().length < 10) {
        validationErrors.push(`Questão ${idx + 1}: Enunciado muito curto (mínimo 10 caracteres)`);
      }
      if (questao.enunciado && questao.enunciado.length > 500) {
        validationErrors.push(`Questão ${idx + 1}: Enunciado não pode exceder 500 caracteres`);
      }

      // Validar exatamente 4 alternativas
      if (questao.alternativas.length !== 4) {
        validationErrors.push(`Questão ${idx + 1}: Deve ter exatamente 4 alternativas (A, B, C, D)`);
      }

      // Alternativas não vazias
      questao.alternativas.forEach((alt) => {
        if (!alt.texto || alt.texto.trim().length < 2) {
          validationErrors.push(`Questão ${idx + 1}, Alternativa ${alt.letra}: Texto muito curto`);
        }
        if (alt.texto && alt.texto.length > 200) {
          validationErrors.push(`Questão ${idx + 1}, Alternativa ${alt.letra}: Texto não pode exceder 200 caracteres`);
        }
      });

      // Validar letras A, B, C, D (sem duplicatas)
      const letras = questao.alternativas.map(alt => alt.letra).sort();
      const letrasUnicas = new Set(letras);
      if (letras.join('') !== 'ABCD' || letrasUnicas.size !== 4) {
        validationErrors.push(`Questão ${idx + 1}: Alternativas devem ter letras A, B, C, D sem duplicatas`);
      }

      // Exatamente 1 alternativa correta
      const corretas = questao.alternativas.filter(alt => alt.correta);
      if (corretas.length !== 1) {
        validationErrors.push(`Questão ${idx + 1}: Deve ter exatamente 1 alternativa correta`);
      }

      // Explicação não vazia
      if (!questao.explicacao || questao.explicacao.trim().length < 10) {
        validationErrors.push(`Questão ${idx + 1}: Explicação muito curta (mínimo 10 caracteres)`);
      }
      if (questao.explicacao && questao.explicacao.length > 1000) {
        validationErrors.push(`Questão ${idx + 1}: Explicação não pode exceder 1000 caracteres`);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Se validação passou, salvar
    onSave({ questoes });
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Editar Exercícios</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Erros de validação */}
        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Corrija os seguintes problemas:</p>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de questões editáveis */}
        <div className="space-y-6">
          {questoes.map((questao, qIdx) => (
            <div key={qIdx} className="border rounded-lg p-4 bg-gray-50">
              {/* Header da questão */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{questao.habilidade_bncc}</Badge>
                <Badge variant="secondary">Bloom: {questao.nivel_bloom}</Badge>
              </div>

              {/* Enunciado */}
              <div className="mb-4">
                <Label htmlFor={`enunciado-${qIdx}`}>
                  {questao.numero}. Enunciado
                </Label>
                <Textarea
                  id={`enunciado-${qIdx}`}
                  value={questao.enunciado}
                  onChange={(e) => updateQuestao(qIdx, 'enunciado', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Alternativas */}
              <div className="mb-4">
                <Label>Alternativas</Label>
                <div className="space-y-2 mt-2">
                  {questao.alternativas.map((alt, aIdx) => (
                    <div key={aIdx} className="flex gap-2 items-center">
                      <span className="font-semibold w-8 text-gray-700">{alt.letra})</span>
                      <Input
                        value={alt.texto}
                        onChange={(e) => updateAlternativa(qIdx, aIdx, 'texto', e.target.value)}
                        className="flex-1"
                        placeholder={`Alternativa ${alt.letra}`}
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={alt.correta}
                          onCheckedChange={(checked) =>
                            updateAlternativa(qIdx, aIdx, 'correta', checked)
                          }
                          id={`correta-${qIdx}-${aIdx}`}
                        />
                        <Label
                          htmlFor={`correta-${qIdx}-${aIdx}`}
                          className="text-xs text-gray-600 cursor-pointer"
                        >
                          Correta
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explicação */}
              <div>
                <Label htmlFor={`explicacao-${qIdx}`}>Explicação (Gabarito)</Label>
                <Textarea
                  id={`explicacao-${qIdx}`}
                  value={questao.explicacao}
                  onChange={(e) => updateQuestao(qIdx, 'explicacao', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => onSave(null)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={validateAndSave}
            disabled={isPending}
          >
            {isPending ? 'Salvando...' : 'Salvar Exercícios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
