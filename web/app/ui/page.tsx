"use client"

import { BigButton } from "@/components/ui/big-button"
import { Card } from "@/components/ui/card"
import { Word } from "@/components/ui/word"

const noop = () => {}

const SUBTITLE = "max-w-[28em] text-[28px] leading-[1.9] md:text-[36px]"

export default function UiDemoPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <Card className="p-6">
        <p lang="fr" className="max-w-[28em] text-[22px] leading-[1.8] text-muted-foreground md:text-[28px]">
          Une partie de l&apos;énergie se dégage sous forme de{" "}
          <Word text="chaleur" translation="calor" state="orange" onTap={noop} /> : c&apos;est pour ça
          qu&apos;on a chaud quand on court.
        </p>
        <p lang="fr" className={`${SUBTITLE} font-bold`}>
          Elle produit aussi des{" "}
          <Word text="déchets" translation="desecho" state="yellow" onTap={noop} /> : de l&apos;eau et
          du{" "}
          <Word
            text="dioxyde de carbone"
            translation="dióxido de carbono"
            state="green"
            onTap={noop}
          />
          .
        </p>
      </Card>
      <div className="flex flex-col gap-4 min-[480px]:flex-row">
        <BigButton variant="unclear" onPress={noop} />
        <BigButton variant="lost" onPress={noop} />
      </div>
    </main>
  )
}
