import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Crosshair, Medal, Target, TrendingUp } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MetricKey = "accuracy_pct" | "precision_pct" | "recall_pct" | "f1_score_pct";
type MetricsData = Record<MetricKey, number>;

type ConfusionMatrixData = {
  labels: string[];
  matrix: number[][];
  normalize: boolean;
};

type LearningCurvesData = {
  x: number[];
  train_loss: number[];
  val_loss: number[];
  train_acc: number[];
  val_acc: number[];
};

export type AttentionVisualizationData = {
  text: string;
  tokens: string[];
  scores: number[];
};

type EmbeddingPoint = {
  x: number;
  y: number;
  label: string;
  text: string;
};

type Embedding2DData = {
  points: EmbeddingPoint[];
  legend: string[];
};

export type TrainingVisualizationData = {
  metrics: MetricsData;
  confusion_matrix: ConfusionMatrixData;
  learning_curves: LearningCurvesData;
  attention_visualization: AttentionVisualizationData;
  embedding_2d: Embedding2DData;
};

export const FALLBACK_TRAINING_VISUALIZATION_DATA: TrainingVisualizationData = {
  metrics: {
    accuracy_pct: 75.01353546291283,
    precision_pct: 73.98667949720452,
    recall_pct: 73.85781500494518,
    f1_score_pct: 73.80828513008321,
  },
  confusion_matrix: {
    labels: [
      "alt.atheism",
      "comp.graphics",
      "comp.os.ms-windows.misc",
      "comp.sys.ibm.pc.hardware",
      "comp.sys.mac.hardware",
      "comp.windows.x",
      "misc.forsale",
      "rec.autos",
      "rec.motorcycles",
      "rec.sport.baseball",
      "rec.sport.hockey",
      "sci.crypt",
      "sci.electronics",
      "sci.med",
      "sci.space",
      "soc.religion.christian",
      "talk.politics.guns",
      "talk.politics.mideast",
      "talk.politics.misc",
      "talk.religion.misc",
    ],
    matrix: [
      [82, 1, 0, 1, 2, 1, 1, 1, 4, 1, 1, 1, 0, 5, 1, 19, 4, 7, 6, 19],
      [0, 135, 14, 4, 6, 8, 1, 0, 1, 0, 0, 2, 11, 3, 3, 0, 0, 2, 1, 0],
      [1, 10, 135, 16, 7, 11, 3, 1, 0, 0, 2, 4, 2, 0, 0, 0, 0, 0, 0, 0],
      [1, 7, 24, 126, 13, 3, 3, 2, 2, 0, 1, 0, 8, 0, 3, 1, 0, 0, 0, 0],
      [1, 8, 9, 9, 142, 1, 5, 0, 2, 1, 0, 2, 6, 0, 1, 0, 1, 0, 0, 0],
      [0, 16, 10, 1, 1, 160, 2, 1, 1, 0, 0, 3, 0, 0, 2, 0, 0, 0, 0, 0],
      [0, 1, 5, 11, 8, 0, 151, 2, 6, 2, 0, 0, 3, 1, 2, 0, 1, 0, 1, 0],
      [1, 1, 2, 0, 0, 0, 5, 147, 12, 1, 0, 1, 9, 0, 1, 0, 7, 0, 2, 0],
      [1, 2, 0, 1, 2, 0, 1, 9, 163, 0, 3, 1, 3, 2, 1, 0, 5, 0, 0, 2],
      [1, 0, 0, 0, 3, 1, 0, 0, 1, 172, 8, 0, 0, 0, 2, 1, 1, 2, 1, 0],
      [0, 1, 0, 0, 2, 0, 0, 1, 3, 10, 173, 2, 0, 1, 1, 0, 1, 0, 1, 1],
      [3, 2, 3, 1, 0, 3, 0, 0, 2, 0, 1, 148, 7, 0, 2, 0, 9, 0, 12, 0],
      [1, 4, 0, 13, 9, 3, 4, 2, 4, 1, 1, 9, 135, 3, 1, 0, 2, 0, 0, 0],
      [3, 3, 0, 0, 1, 1, 1, 0, 3, 0, 1, 0, 2, 171, 1, 0, 2, 2, 1, 1],
      [3, 6, 1, 2, 3, 1, 0, 1, 2, 2, 1, 0, 5, 3, 158, 0, 3, 0, 2, 0],
      [9, 1, 1, 1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 3, 0, 153, 2, 0, 1, 22],
      [4, 1, 0, 0, 0, 0, 1, 1, 0, 2, 0, 11, 2, 2, 2, 0, 139, 1, 11, 2],
      [9, 0, 0, 0, 2, 0, 0, 0, 2, 2, 1, 4, 1, 1, 2, 1, 4, 150, 4, 2],
      [1, 0, 0, 0, 0, 0, 2, 1, 0, 3, 3, 4, 1, 4, 4, 2, 25, 9, 91, 3],
      [24, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 3, 0, 1, 2, 24, 9, 6, 7, 40],
    ],
    normalize: false,
  },
  learning_curves: {
    x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    train_loss: [1.9360122976964609, 1.4776512718614125, 0.8295218461233637, 0.8000275127363274, 0.5633194415158657, 0.558235289145639, 0.38157836674731604, 0.3727761545314498, 0.2433727450576224, 0.24522974219059485],
    val_loss: [1.141966115982914, 0.8769249425907946, 0.8608584424327971, 0.8439493747607112, 0.8931224703821037, 0.8774764760864675, 0.9021181709198909, 0.8818181325935459, 0.9064266129041022, 0.8999294396212454],
    train_acc: [0.4196170520231214, 0.5473265895953757, 0.7396739130434783, 0.7450253256150506, 0.8143168604651163, 0.8205615942028985, 0.8797376093294461, 0.8838896952104499, 0.9314692982456141, 0.928234011627907],
    val_acc: [0.6406715407527755, 0.7251556999729217, 0.7297590035201733, 0.7389656106146764, 0.7303005686433793, 0.7465475223395613, 0.7465475223395613, 0.7554833468724614, 0.7554833468724614, 0.75981586785811],
  },
  attention_visualization: {
    text: "\n\nI am sure some bashers of Pens fans are pretty confused about the lack\nof any kind of posts about the recent Pens massacre of the Devils. Actually,\nI am  bit puzzled too and a bit relieved. However, I am going to put an end\nto non-PIttsburghers' relief with a bit of praise for the Pens. Man, they\nare killing those Devils worse than I thought. Jagr just showed you why\nhe is much better than his regular season stats. He is also a lot\nfo fun to watch in the playoffs. Bowman should let JAgr have a lot of\nfun in the next couple of games since the Pens are going to beat the pulp out of Jersey anyway. I was very disappointed not to see the Islanders lose the final\nregular season game.          PENS RULE!!!\n\n",
    tokens: [
      "i", "am", "sure", "some", "bashers", "of", "pens", "fans", "are", "pretty", "confused", "about", "the", "lack", "of", "any", "kind", "of", "posts", "about", "the", "recent", "pens", "massacre", "of", "the", "devils", ".", "actually", ",", "i", "am", "bit", "puzzled", "too", "and", "a", "bit", "relieved", ".", "however", ",", "i", "am", "going", "to", "put", "an", "end", "to", "non", "-", "pittsburghers", "'", "relief", "with", "a", "bit", "of", "praise", "for", "the", "pens", ".", "man", ",", "they", "are", "killing", "those", "devils", "worse", "than", "i", "thought", ".", "jagr", "just", "showed", "you", "why", "he", "is", "much", "better", "than", "his", "regular", "season", "stats", ".", "he", "is", "also", "a", "lot", "fo", "fun", "to", "watch", "in", "the", "playoffs", ".", "bowman", "should", "let", "jagr", "have", "a", "lot", "of", "fun", "in", "the", "next", "couple", "of", "games", "since", "the", "pens", "are", "going", "to", "beat", "the", "pulp", "out", "of", "jersey", "anyway", ".", "i", "was", "very", "disappointed", "not", "to", "see", "the", "islanders", "lose", "the", "final", "regular", "season", "game", ".", "pens", "rule", "!", "!", "!",
    ],
    scores: [
      0.0001441715139662847, 0.00024250629940070212, 0.0003274257469456643, 0.0003074267879128456, 0.004712698224466294, 0.0013526667607948184, 0.1291242092847824, 0.0032013074960559607, 0.00021897115220781416, 0.000612707925029099, 0.0015423785662278533, 0.0015925378538668156, 0.0012603785144165158, 0.00026411510771140456, 0.00011105446901638061, 0.00014605859178118408, 0.00004671019269153476, 0.0001369264500681311, 0.0018489034846425056, 0.0022617215290665627, 0.0020058376248925924, 0.00047226701281033456, 0.01845870353281498, 0.02093585394322872, 0.0008739788318052888, 0.002348396461457014, 0.03997484967112541, 0.004103509709239006, 0.00017330629634670913, 0.00003310523243271746, 0.00010988504800479859, 0.00032174537773244083, 0.0021401220001280308, 0.002007023198530078, 0.0006482013268396258, 0.0005328420083969831, 0.00038248166674748063, 0.0015229466371238232, 0.005735620856285095, 0.00477644894272089, 0.0006540613248944283, 0.0008026146679185331, 0.00021580109023489058, 0.00034794979728758335, 0.00032820409978739917, 0.0006004608585499227, 0.00014437537174671888, 0.0007552941096946597, 0.00026076743961311877, 0.0005180402658879757, 0.0006930881645530462, 0.0017122229328379035, 0.014700265135616064, 0.0008071718621067703, 0.042504407465457916, 0.0004983498947694898, 0.00025745650054886937, 0.00022805573826190084, 0.00015389666077680886, 0.0039040767587721348, 0.0034104592632502317, 0.004298737272620201, 0.06989073008298874, 0.005056027323007584, 0.00017488076991867274, 0.00008109262853395194, 0.0014153154334053397, 0.00023405434330925345, 0.0004232180945109576, 0.0010983349056914449, 0.07287298142910004, 0.00022416835417971015, 0.00020436799968592823, 0.0001187750167446211, 0.0001595418289070949, 0.004560595378279686, 0.017155461478978395, 0.00011242625623708591, 0.0006939515005797148, 0.00009917056013364345, 0.0001734394463710487, 0.02170419692993164, 0.0011742569040507078, 0.0002846327843144536, 0.016463834792375565, 0.00033526468905620277, 0.005289246793836355, 0.004402489401400089, 0.013100611045956612, 0.05224883556365967, 0.0028338711708784103, 0.005662992130964994, 0.00017192383529618382, 0.0000865984329720959, 0.00005016973227611743, 0.00008765574602875859, 0.0007297495467355475, 0.0004965774714946747, 0.00006946719804545864, 0.002999568125233054, 0.0006691864691674709, 0.0008212939719669521, 0.006136193871498108, 0.00373473996296525, 0.033218566328287125, 0.00023495149798691273, 0.0004893972654826939, 0.00614873314043507, 0.00048782044905237854, 0.00015339066158048809, 0.00008887394506018609, 0.000162637879839167, 0.005028226412832737, 0.0006751875625923276, 0.000596419966313988, 0.00010591741738608107, 0.000026047138817375526, 0.00009055516420630738, 0.006395587231963873, 0.00018499539874028414, 0.0027351367752999067, 0.034404560923576355, 0.0007552376482635736, 0.00013430468970909715, 0.0002590211806818843, 0.0007983117247931659, 0.00019005783542525023, 0.0004619539249688387, 0.00019531096040736884, 0.0012563964119181037, 0.015815211459994316, 0.0013108679559081793, 0.004964751657098532, 0.0005797122721560299, 0.0004603974521160126, 0.0002700019394978881, 0.000829135999083519, 0.00024820351973176, 0.000445395678980276, 0.0013685793383046985, 0.009331600740551949, 0.0977305918931961, 0.004022924229502678, 0.004281037952750921, 0.0009121740586124361, 0.007755002938210964, 0.011490422300994396, 0.005126330070197582, 0.0006480402080342174, 0.03511486575007439, 0.007235394325107336, 0.00018518880824558437, 0.00019097569747827947, 0.0002633779076859355,
    ],
  },
  embedding_2d: {
    points: [
      { x: 0, y: 20.4, label: "rec.autos", text: "Hi everybody,\n\n   I will buy a Honda Civic EX Coupe.  The dealer ask $12,750 for it,\nincluding A/C (" },
      { x: 84.15, y: 19.72, label: "comp.graphics", text: "    Help!! I need code/package/whatever to take 3-D data and turn it into\na wireframe surface with h" },
      { x: 41.44, y: 48.11, label: "rec.motorcycles", text: "\n  Not with a hub cap but one of those \"Lumber yard delivery\ntrucks\" made life interesting when he h" },
      { x: 32.02, y: 32.04, label: "talk.politics.guns", text: "[Posting the text of H.R. 893 ...]\n[ ... ]\n[page break]\n\nOB ill-wind-and-all-that:  with Bill the Pr" },
      { x: 3.66, y: 9.6, label: "misc.forsale", text: "88 toyota Camry - Top Of The Line Vehicle\nblue book $10,500\nasking 9,900.\n\n73 k miles\nauto transmiss" },
      { x: 34.14, y: 30.1, label: "talk.politics.guns", text: "\n\n\n\tWhy sell them at a low price to poor people immediately?  The NRA\nis an educational organization" },
      { x: 52.57, y: 34.97, label: "talk.politics.guns", text: "I need quotes from Jefferson, Hamilton, Madison, or any of the other founders,\nthat support the idea" },
      { x: 62.19, y: 32.27, label: "comp.sys.mac.hardware", text: "Has anyone had any problems with their Duo Dock not ejecting the Duo\nproperly?\n\nWhen I first got it," },
      { x: 26.63, y: 31.23, label: "rec.motorcycles", text: "My old jacket is about to bite the dust so I'm in the market for a new riding\njacket.  I'm looking f" },
      { x: 98.22, y: 7.65, label: "comp.windows.x", text: "this */\n     */\nI tried\nhow can I\n\nDoes the workstation you're using have hardware cursor support?  " },
      { x: 43.66, y: 62.75, label: "rec.sport.baseball", text: "I was on vacation all last week and didn't see any news at all. Could\nsomebody fill me in on how St." },
      { x: 100, y: 0.85, label: "comp.windows.x", text: "Hello, recently I have been printing out a lot of files on school's laser printer and feeling guilty" },
      { x: 47.19, y: 31.5, label: "sci.crypt", text: "\nBig deal. If you are a legitimate law enforcement agent and have a\nlegitimate wiretap order, you ju" },
      { x: 68.43, y: 34.18, label: "sci.space", text: "  Sorry, you have a _wish_ for an uncluttered night sky, but it\nisn't a right. When you get down to " },
      { x: 60.91, y: 31.31, label: "sci.med", text: "Dear news readers,\n\nIs there anyone using sheep models for cardiac research, specifically\nconcerned " },
      { x: 30.19, y: 32.96, label: "talk.religion.misc", text: ": : Seems to me Koresh is yet another messenger that got killed\n: : for the message he carried. (Whi" },
      { x: 61.08, y: 98.41, label: "rec.sport.hockey", text: "\n: What are the Leafs to do?  I am a Leaf supporter and\n: I say the Leafs are going down in four unl" },
      { x: 61.72, y: 30.55, label: "comp.os.ms-windows.misc", text: "In comp.os.ms-windows.misc you write:\n\n\nyou might want to look in windows FAQ for this one, but here" },
      { x: 7.51, y: 5.23, label: "misc.forsale", text: "Brand new, still shrink wraped Stealth 24 for sale $150 plus shipping \nand COD. \nSpecifications:\nBas" },
      { x: 39.81, y: 19.17, label: "comp.sys.ibm.pc.hardware", text: "Hi all,\n\n  I would like to purchase CD-ROM drive. The specs I would like to have is:\n\n   * Applicabl" },
      { x: 58.01, y: 39.86, label: "sci.crypt", text: "  I suspect that the decisive element in the political battle will be the\nFUD (Fear, Uncertainty, Do" },
      { x: 9.94, y: 12.54, label: "misc.forsale", text: "Panasonic KX-T3000H, Combo black cordless & speaker phone all in one.\n new- $160, now- $100 + shippi" },
      { x: 96.02, y: 4.48, label: "comp.windows.x", text: "I am wondering how to change the English fonts in an existed\nAPI to some multi-bytes fonts ? (such a" },
      { x: 45.01, y: 25.8, label: "talk.politics.mideast", text: "\n\n\tHuh?  Mohamed Salimeh was perhaps a Korean?  How do you claim\narab-americans had no involvement i" },
      { x: 64.88, y: 97.38, label: "rec.sport.hockey", text: "\n\nWell, I agree that if you're going to stand in front of the net,\nthat you should expect to get hit" },
      { x: 4.27, y: 24.24, label: "rec.autos", text: "I'd like to converse with anyone who has purchased a 1993 Honda\nCivic about their experience.  I'm n" },
      { x: 36.69, y: 18.31, label: "misc.forsale", text: "\nSells for $570 here (Southern California) almost everywhere." },
      { x: 7.31, y: 12.61, label: "misc.forsale", text: "\n\nJust a follow-up note, I have sold the receiver, so don't e-mail or call \nme anymore.  Sorry to di" },
      { x: 45.17, y: 41.06, label: "rec.motorcycles", text: "\nThis sounds suspiciously like black magic to me.  If by \"quick wiggle\nto the right\" you mean that t" },
      { x: 51.02, y: 27.41, label: "talk.politics.mideast", text: " \n[TC] Do you, as I do, agree that this (sort) of \"peace process\" is needed?\n[TC] What about the par" },
      { x: 85.09, y: 18.9, label: "comp.graphics", text: "If anyone has a list of companies doing data visualization (software\nor hardware) I would like to he" },
      { x: 88.9, y: 11.38, label: "comp.os.ms-windows.misc", text: "\n\n\n\nThe control box of the Window itself (upper left corner of the window, single\nclick, am I being " },
      { x: 49.93, y: 37.76, label: "sci.crypt", text: "One presumes the system could work as follows:\n\na) Blank clips are manufactured by Mykotronx and VLS" },
      { x: 41.32, y: 32.59, label: "soc.religion.christian", text: "From article <Apr.15.00.58.22.1993.28891@athos.rutgers.edu>, by ruthless@panix.com (Ruth Ditucci):\n\n" },
      { x: 34.36, y: 22.62, label: "talk.politics.guns", text: "\nIn the FBI briefing, no mention was made of having the fire starters in  \ncustody.\nnot  \n\nWhy not h" },
      { x: 56.2, y: 57.15, label: "rec.sport.baseball", text: "I am trying to get a copy of the _official_ rules of baseball.\nSomeone once sent me the ISBN number " },
      { x: 58.35, y: 100, label: "rec.sport.hockey", text: "I have been to all 3 Isles/Caps tilts at the Crap Centre this year, all Isles\nwins and there is no j" },
      { x: 13.7, y: 43.56, label: "rec.autos", text: "\n\n\n\n\tI think the Manta is the European name for the \"GT.\"  I'm pretty sure\nthat the only Kadett's so" },
      { x: 95.38, y: 12.31, label: "comp.graphics", text: "Hi!... \n\nI am searching for packages that could handle Multi-page GIF\nfiles...    \n\nAre there any on" },
      { x: 46.57, y: 35.67, label: "talk.politics.mideast", text: "\nMaybe he will. Maybe he is working for the secret Turkish service. You never \nknow. \n\n\nNo it is sti" },
      { x: 82.43, y: 35.07, label: "sci.crypt", text: "[A lot of this article has been deleted for space.]\n" },
      { x: 64.71, y: 46.93, label: "sci.electronics", text: "\n\nYou are quite correct in your understanding.  The filtering is not\ninterpolation, as that would di" },
      { x: 46.91, y: 17.09, label: "alt.atheism", text: "\t[...details of US built chemical plant at Al Alteer near Baghdad...]\n: However, the plant's intende" },
      { x: 52.04, y: 41.46, label: "talk.politics.mideast", text: "\n     ah c'mon, give the guy three days and see what comes up.\n\n     LEO" },
      { x: 52.35, y: 46.74, label: "rec.sport.baseball", text: "As of today, April 17, Jack Morris has lost his first three starts.\n\nHowever, the Jays are doing wel" },
      { x: 23.65, y: 0, label: "misc.forsale", text: "Hi folks,\n\tI have a 386/25 daughter board for Zeos, which I want to upgrade to\n486/25 or 33. \nSo sen" },
      { x: 34.6, y: 29.53, label: "talk.politics.misc", text: "\nDo they have a history of working in massage parlors, and telling\nco-workers there that they are pr" },
      { x: 93.83, y: 11.91, label: "comp.os.ms-windows.misc", text: "\nVery well indeed.  At home (a VL Bus version of the Graphics Pro) I can stretch\nan AVI window to 64" },
      { x: 92.56, y: 8.09, label: "comp.windows.x", text: "I want to press a function key and have a text string appear in an\nXmText widget.  When I put\n\n\t*XmT" },
      { x: 53.75, y: 98.33, label: "rec.sport.hockey", text: "\n\n\n\n\n\n\nI too am of the same  sentiment Bart, but realistically, this town DOESN'T WANT TO pay for \nq" },
    ],
    legend: [
      "alt.atheism",
      "comp.graphics",
      "comp.os.ms-windows.misc",
      "comp.sys.ibm.pc.hardware",
      "comp.sys.mac.hardware",
      "comp.windows.x",
      "misc.forsale",
      "rec.autos",
      "rec.motorcycles",
      "rec.sport.baseball",
      "rec.sport.hockey",
      "sci.crypt",
      "sci.electronics",
      "sci.med",
      "sci.space",
      "soc.religion.christian",
      "talk.politics.guns",
      "talk.politics.mideast",
      "talk.politics.misc",
      "talk.religion.misc",
    ],
  },
};

const metricCards: Array<{
  key: MetricKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}> = [
  { key: "accuracy_pct", label: "Accuracy", icon: TrendingUp, iconClass: "text-blue-500" },
  { key: "precision_pct", label: "Precision", icon: Target, iconClass: "text-green-500" },
  { key: "recall_pct", label: "Recall", icon: Crosshair, iconClass: "text-violet-500" },
  { key: "f1_score_pct", label: "F1-Score", icon: Medal, iconClass: "text-orange-500" },
];

const toPercent = (value: number) => `${value.toFixed(1)}%`;
const lerp = (value: number, min: number, max: number) => (max === min ? 0 : (value - min) / (max - min));
const TRAIN_COLOR = "#93C5FD";
const VAL_COLOR = "#FCA5A5";

function MetricsPanel({ metrics }: { metrics: MetricsData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metricCards.map(({ key, label, icon: Icon, iconClass }) => (
        <div key={key} className="rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{label}</span>
            <Icon className={`h-4 w-4 ${iconClass}`} />
          </div>
          <div className="mt-5 text-4xl font-semibold text-slate-900">{toPercent(metrics[key])}</div>
        </div>
      ))}
    </div>
  );
}

function ConfusionPanel({ confusion }: { confusion: ConfusionMatrixData }) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const rowCount = confusion.matrix.length;
  const colCount = Math.max(0, ...confusion.matrix.map((row) => row.length));
  const flattenedValues = confusion.matrix.flat();
  const maxValue = flattenedValues.length > 0 ? Math.max(...flattenedValues) : 1;
  const alpha = (value: number) => 0.2 + (value / Math.max(1, maxValue)) * 0.75;
  const getClassTick = (index: number) => `C${index}`;
  const truncateLabel = (label: string, maxLength = 22) =>
    label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
  const cellClass =
    "min-h-16 rounded-xl flex items-center justify-center text-xl font-semibold transition-all duration-200 hover:scale-[1.02] px-2 py-3";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-center text-3xl font-semibold text-slate-900">Confusion Matrix</h3>
      <div className="overflow-x-auto">
        <div
          className="mx-auto grid max-w-5xl gap-3"
          style={{ gridTemplateColumns: `minmax(180px, auto) repeat(${colCount}, minmax(64px, 1fr))` }}
        >
          <div className="text-center text-sm font-medium text-slate-600 py-2">Actual \ Predicted</div>
          {Array.from({ length: colCount }).map((_, colIdx) => (
            <div
              key={`col-header-${colIdx}`}
              className="text-center text-xs font-semibold text-slate-700 py-2"
              title={confusion.labels[colIdx] ?? `Class ${colIdx + 1}`}
            >
              {getClassTick(colIdx)}
            </div>
          ))}

          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="contents">
              <div
                key={`row-header-${rowIdx}`}
                className="flex items-center justify-start text-sm font-medium text-slate-700 pl-1"
                title={confusion.labels[rowIdx] ?? `Class ${rowIdx + 1}`}
              >
                {getClassTick(rowIdx)} - {truncateLabel(confusion.labels[rowIdx] ?? `Class ${rowIdx + 1}`)}
              </div>
              {Array.from({ length: colCount }).map((__, colIdx) => {
                const value = confusion.matrix[rowIdx]?.[colIdx] ?? 0;
                return (
                  <button
                    key={`cell-${rowIdx}-${colIdx}`}
                    type="button"
                    className={cellClass}
                    style={{
                      backgroundColor: `rgba(59,130,246,${alpha(value)})`,
                      color: value > maxValue * 0.55 ? "#fff" : "#0f172a",
                    }}
                    onMouseEnter={() =>
                      setHoveredCell(
                        `Actual: ${confusion.labels[rowIdx] ?? `Class ${rowIdx + 1}`} | Predicted: ${confusion.labels[colIdx] ?? `Class ${colIdx + 1}`} | Count: ${value}`,
                      )
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold text-slate-600">Class Index Legend</p>
        <div className="grid grid-cols-1 gap-1 text-xs text-slate-700 md:grid-cols-2">
          {confusion.labels.map((label, index) => (
            <div key={`legend-${index}`} className="truncate" title={label}>
              {getClassTick(index)}: {label}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">{hoveredCell ?? "Hover over a cell for details."}</p>
    </div>
  );
}

function LearningChart({
  title,
  data,
  trainKey,
  valKey,
  trainLabel,
  valLabel,
  yLabel,
  yDomain,
}: {
  title: string;
  data: Array<Record<string, number>>;
  trainKey: string;
  valKey: string;
  trainLabel: string;
  valLabel: string;
  yLabel: string;
  yDomain?: [number, number];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h4 className="mb-3 text-xl font-semibold text-slate-900">{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="epoch" />
          <YAxis
            domain={yDomain}
            label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            tick={{ fill: "#475569", fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={trainKey}
            stroke={TRAIN_COLOR}
            strokeWidth={3}
            name={trainLabel}
            dot={{ r: 4, fill: "#fff", stroke: TRAIN_COLOR, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            animationDuration={700}
          />
          <Line
            type="monotone"
            dataKey={valKey}
            stroke={VAL_COLOR}
            strokeWidth={3}
            name={valLabel}
            dot={{ r: 4, fill: "#fff", stroke: VAL_COLOR, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            animationDuration={700}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttentionPanel({ attention }: { attention: AttentionVisualizationData }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxScore = Math.max(...attention.scores);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
      <h3 className="mb-5 text-3xl font-semibold text-slate-900">Attention Visualization</h3>
      <div className="rounded-xl bg-slate-50 p-6">
        <div className="flex flex-wrap justify-center gap-2">
          {attention.tokens.map((token, i) => {
            const intensity = maxScore === 0 ? 0 : attention.scores[i] / maxScore;
            return (
              <button
                type="button"
                key={`${token}-${i}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-md px-3 py-2 transition-all duration-150 hover:-translate-y-0.5"
                style={{ backgroundColor: `rgba(59,130,246,${0.2 + intensity * 0.8})` }}
              >
                {token}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {hovered === null
          ? "Higher attention values indicate words that influenced the model prediction."
          : `Token "${attention.tokens[hovered]}" score: ${attention.scores[hovered].toFixed(2)}`}
      </p>
    </div>
  );
}

function EmbeddingPanel({ embedding }: { embedding: Embedding2DData }) {
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const width = 860;
  const height = 520;
  const p = { t: 24, r: 24, b: 64, l: 44 };
  const xs = embedding.points.map((point) => point.x);
  const ys = embedding.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const labels = embedding.legend.length > 0 ? embedding.legend : Array.from(new Set(embedding.points.map((point) => point.label)));
  const palette = [
    "#93C5FD",
    "#FCA5A5",
    "#86EFAC",
    "#C4B5FD",
    "#FCD34D",
    "#67E8F9",
    "#FDBA74",
    "#F9A8D4",
    "#A3E635",
    "#D8B4FE",
  ];
  const labelToColor = labels.reduce<Record<string, string>>((acc, label, index) => {
    acc[label] = palette[index % palette.length];
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-center text-3xl font-semibold text-slate-900">2D Embedding Visualization</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 1, 2, 3, 4].map((k) => {
          const y = p.t + (k / 4) * (height - p.t - p.b);
          return <line key={`gy-${k}`} x1={p.l} y1={y} x2={width - p.r} y2={y} stroke="#E5E7EB" strokeDasharray="4 8" />;
        })}
        {[0, 1, 2, 3, 4].map((k) => {
          const x = p.l + (k / 4) * (width - p.l - p.r);
          return <line key={`gx-${k}`} x1={x} y1={p.t} x2={x} y2={height - p.b} stroke="#E5E7EB" strokeDasharray="4 8" />;
        })}

        {embedding.points.map((point, i) => {
          const cx = p.l + lerp(point.x, minX, maxX) * (width - p.l - p.r);
          const cy = height - p.b - lerp(point.y, minY, maxY) * (height - p.t - p.b);
          const isHovered = hoveredText === point.text;
          const fill = labelToColor[point.label] ?? TRAIN_COLOR;
          return (
            <circle
              key={`${point.text}-${i}`}
              cx={cx}
              cy={cy}
              r={isHovered ? 8 : 6}
              fill={fill}
              opacity={isHovered ? 1 : 0.7}
              onMouseEnter={() => setHoveredText(point.text)}
              onMouseLeave={() => setHoveredText(null)}
              className="transition-all duration-150"
            />
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {labels.map((label) => (
          <span key={label} className="flex items-center gap-2 text-slate-700">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: labelToColor[label] }} />
            {label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-slate-600">{hoveredText ?? "Hover over points to see sample text."}</p>
    </div>
  );
}

export function TrainingVisualizations({ data }: { data?: TrainingVisualizationData | null }) {
  const safeData = data ?? FALLBACK_TRAINING_VISUALIZATION_DATA;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-2xl font-semibold text-slate-900">Training Visualizations</h2>
      <Tabs.Root defaultValue="metrics">
        <Tabs.List className="mb-6 grid grid-cols-5 gap-1 rounded-full bg-slate-100 p-1">
          <Tabs.Trigger value="metrics" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Metrics</Tabs.Trigger>
          <Tabs.Trigger value="confusion" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Confusion</Tabs.Trigger>
          <Tabs.Trigger value="learning" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Learning</Tabs.Trigger>
          <Tabs.Trigger value="attention" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Attention</Tabs.Trigger>
          <Tabs.Trigger value="embedding" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Embedding</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="metrics"><MetricsPanel metrics={safeData.metrics} /></Tabs.Content>
        <Tabs.Content value="confusion"><ConfusionPanel confusion={safeData.confusion_matrix} /></Tabs.Content>
        <Tabs.Content value="learning">
          <div className="space-y-5">
            <LearningChart
              title="Training & Validation Loss"
              data={safeData.learning_curves.x.map((epoch, index) => ({
                epoch,
                trainLoss: safeData.learning_curves.train_loss[index],
                valLoss: safeData.learning_curves.val_loss[index],
              }))}
              trainKey="trainLoss"
              valKey="valLoss"
              trainLabel="Training Loss"
              valLabel="Validation Loss"
              yLabel="Loss"
            />
            <LearningChart
              title="Training & Validation Accuracy"
              data={safeData.learning_curves.x.map((epoch, index) => ({
                epoch,
                trainAcc: safeData.learning_curves.train_acc[index] * 100,
                valAcc: safeData.learning_curves.val_acc[index] * 100,
              }))}
              trainKey="trainAcc"
              valKey="valAcc"
              trainLabel="Training Accuracy"
              valLabel="Validation Accuracy"
              yLabel="Accuracy (%)"
              yDomain={[0, 100]}
            />
          </div>
        </Tabs.Content>
        <Tabs.Content value="attention"><AttentionPanel attention={safeData.attention_visualization} /></Tabs.Content>
        <Tabs.Content value="embedding"><EmbeddingPanel embedding={safeData.embedding_2d} /></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
