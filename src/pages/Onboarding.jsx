import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import IntakeChat from "@/components/onboarding/IntakeChat";
import BlueprintReveal from "@/components/onboarding/BlueprintReveal";

/**
 * Conversational onboarding: the intake interview, then the generated blueprint.
 * Nothing is written to the database until the blueprint comes back.
 */
export default function Onboarding() {
  const [phase, setPhase] = useState("intake");
  const [intake, setIntake] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [error, setError] = useState(null);

  const generate = async (answers) => {
    setIntake(answers);
    setPhase("reveal");
    setError(null);
    try {
      const response = await base44.functions.invoke("generateBlueprint", { intake: answers });
      setBlueprint(response.data);
    } catch (e) {
      setError(e?.message || "the assistant is unreachable");
    }
  };

  return (
    <div className="min-h-screen gradient-veil">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </Link>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> OccasioAI intake
          </span>
        </div>

        <div className="flex-1">
          {phase === "intake" ? <IntakeChat onComplete={generate} /> : null}
          {phase === "reveal" ? (
            <BlueprintReveal
              intake={intake}
              blueprint={blueprint}
              saving={!blueprint && !error}
              error={error}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}