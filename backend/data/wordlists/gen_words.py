import os

base = r"C:\data\liang\code\github_projects\the_lost_codex\backend\data\wordlists"

grade10 = [
    "accommodate","accomplish","accumulate","accurate","acknowledge","acquire","adapt","adequate","adjacent","adjust",
    "administration","advocate","affect","afford","aggressive","allocate","alternative","ambiguous","analyze","anticipate",
    "apparent","appreciate","appropriate","approximate","arbitrary","aspect","assess","assign","assist","assume",
    "assure","attach","attain","attitude","attribute","authentic","authorize","available","aware","behalf",
    "bias","capable","capacity","capture","category","challenge","characteristic","clarify","classify","collaborate",
    "commitment","compatible","compensate","competent","complex","component","concentrate","concept","conclude","conduct",
    "confirm","conflict","consequence","considerable","consistent","construct","context","contribute","controversial","convenient",
    "convince","coordinate","correspond","criteria","crucial","cultivate","curious","declare","dedicate","define",
    "deliberate","depend","derive","describe","deserve","determine","devote","diagnose","differ","diligent",
    "discipline","distribute","diverse","dominant","dramatic","dynamic","effective","eliminate","emerge","emphasize",
    "enable","encounter","engage","enhance","ensure","establish","evaluate","evident","evolve","examine",
    "exceed","exclude","execute","exhibit","expand","explicit","expose","extensive","facilitate","factor",
    "feature","flexible","focus","formal","formulate","foundation","function","generate","global","govern",
    "identify","illustrate","implement","imply","impose","indicate","individual","initiative","innovate","insight",
    "inspire","integrate","interpret","involve","issue","maintain","manage","maximize","measure","method",
    "minimize","modify","monitor","motivate","negotiate","objective","obtain","obvious","occur","operate",
    "opportunity","organize","outcome","overcome","participate","perceive","perform","perspective","phenomenon","potential",
    "predict","prefer","prepare","preserve","prevent","primary","principle","process","promote","propose",
    "provide","publish","pursue","qualify","recognize","recommend","reduce","reflect","regulate","reinforce",
    "relate","relevant","rely","represent","require","research","resolve","respond","restrict","retain",
    "reveal","review","revise","significant","simplify","solve","specify","strategy","structure","submit",
    "substitute","sufficient","summarize","support","sustain","symbol","target","technique","tendency","theory",
    "transfer","transform","transmit","typical","ultimate","undergo","utilize","valid","variety","verify",
    "volunteer","widespread","abstract","access","account","activate","acute",
]

grade11 = [
    "bureaucracy","catastrophe","chronological","comprehensive","conceive","consecutive","consolidate","contemplate",
    "contradict","controversy","correlate","counterpart","credibility","criterion","critique","cumulative","cynical",
    "deduce","deficiency","depict","designate","deteriorate","deviate","differentiate","diminish","discrepancy",
    "disseminate","elaborate","encompass","endeavor","equivalent","erroneous","ethical","exaggerate",
    "exemplify","exhaust","exploit","fluctuate","formidable","fragile","hierarchy","implication","inadequate",
    "incorporate","inevitable","infrastructure","inherent","intellectual","intervene","intuition","irrelevant",
    "legislation","legitimate","manipulate","mechanism","metaphor","methodology","misconception","moderate","momentum",
    "narrative","nonetheless","notion","obscure","obstacle","paradox","persist","plausible","predominant",
    "preliminary","profound","prohibit","proportion","rational","reconcile","redundant","reluctant","remedy",
    "rhetoric","rigorous","scenario","skeptical","sophisticated","speculate","stereotype","stimulate","subordinate",
    "supplement","suppress","symbolic","systematic","terminate","tolerate","transition","transparent","undermine",
    "unprecedented","vague","versatile","virtually","vulnerable","accelerate","adjacent","advocate","affect",
    "affordable","aggressive","allocate","ambiguous","anticipate","apparent","appreciate","approximate","arbitrary",
    "aspect","assign","assist","assure","attach","attain","authentic","authorize","behalf","bias",
    "capable","capacity","capture","category","challenge","characteristic","clarify","classify","collaborate",
    "commitment","compatible","compensate","competent","component","concentrate","conclude","conduct","confirm",
    "conflict","consequence","considerable","consistent","construct","context","contribute","controversial","convenient",
    "convince","correspond","crucial","cultivate","curious","declare","dedicate","deliberate","depend","derive",
    "deserve","determine","devote","diagnose","diligent","discipline","distribute","dominant","dramatic",
    "dynamic","eliminate","emerge","emphasize","enable","encounter","engage","enhance","ensure","establish",
    "evident","evolve","examine","exceed","exclude","execute","exhibit","expand","expose","extensive",
    "facilitate","factor","feature","flexible","focus","formal","formulate","foundation","generate","global",
    "govern","identify","illustrate","implement","imply","impose","indicate","individual","initiative","innovate",
    "insight","inspire","integrate","interpret","involve","issue","maintain","manage","maximize","measure",
    "minimize","modify","monitor","motivate","negotiate","objective","obtain","obvious","occur","operate",
    "opportunity","organize","outcome","overcome","participate","perceive","perform","perspective","phenomenon",
    "potential","predict","prefer","prepare","preserve","prevent","primary","principle","process","promote",
    "propose","provide","publish","pursue","qualify","recognize","recommend","reduce","reflect","regulate",
    "reinforce","relate","relevant","rely","represent","require","research","resolve","respond","restrict",
    "retain","reveal","review","revise","significant","simplify","solve","specify","strategy","structure",
    "submit","substitute","sufficient","summarize","support","sustain","symbol","target","technique","tendency",
    "theory","transfer","transform","transmit","typical","ultimate","undergo","utilize","valid","variety",
    "verify","volunteer","widespread","abstract","access","account","activate","acute",
]

grade12 = [
    "aberration","abstain","accentuate","accolade","acquiesce","adamant","admonish","adversity","aesthetic","affirmation",
    "aggravate","alleviate","altruistic","ambivalent","ameliorate","anachronism","anecdote","antagonize","apathy","apprehension",
    "articulate","aspiration","assertion","astute","atrocity","audacious","aversion","benevolent","brevity","candid",
    "catalyst","caustic","circumvent","clandestine","coerce","coherent","complacent","concede","condescend","connotation",
    "conspicuous","contempt","conviction","copious","corroborate","credulous","cryptic","debilitate","deceptive","deference",
    "degenerate","denounce","deplete","derogatory","despondent","detrimental","digress","diligence","discern","disdain",
    "disparate","dispel","dissonance","diverge","dogmatic","dubious","eccentric","elusive","emulate","enigmatic",
    "ephemeral","equivocal","eradicate","estrange","euphemism","exacerbate","exemplary","exonerate","expedite","extravagant",
    "fabricate","fallacy","fanatical","feasible","fervent","foreshadow","fortify","frugal","futile","grandiose",
    "gratuitous","grievance","hamper","haphazard","harbinger","hinder","hypocritical","idealize","idiosyncrasy","imminent",
    "impartial","impede","implicit","incessant","incite","indifferent","indulge","infer","ingenious","innate",
    "instigate","intangible","intimidate","invoke","irrational","jeopardize","juxtapose","lament","lenient","lucid",
    "malicious","meticulous","mitigate","mundane","negate","negligent","neutral","nullify","obscure","obsolete",
    "ominous","oppressive","ostracize","outweigh","pacify","partisan","patronize","perpetuate","pessimistic","pragmatic",
    "precarious","precipitate","pretentious","prolong","provoke","prudent","refute","reinstate","reiterate","renounce",
    "repudiate","resilient","retaliate","revere","scrutinize","segregate","skepticism","slander","solemn","stagnate",
    "subjective","superficial","tenacious","trivial","turbulent","unify","unjust","validate","vindicate","wary",
    "zealous","abdicate","abridge","absolve","abstraction","acclaim","acrimony","adhere","adroit","advocate",
    "affable","affluent","aggression","agitate","aloof","altercation","ambiguity","ameliorate","amicable","amplify",
    "anachronism","anarchy","antagonism","apathetic","appease","arbitrary","archaic","ardent","arrogant","articulate",
    "ascertain","assimilate","atone","audacity","augment","austere","autonomy","avarice","avert","banal",
    "belittle","benign","blatant","bolster","bravado","callous","capricious","censure","chronic","circumspect",
    "coalesce","coerce","cogent","collateral","commensurate","compassion","compel","conciliate","condone","confiscate",
    "confront","conjecture","conscientious","contemplate","contend","contrite","convey","copious","counteract","covert",
    "credence","culpable","curtail","cynicism","daunt","debunk","decry","defer","defiant","delude",
    "demean","depravity","deride","desist","devious","diffuse","digress","discredit","disdainful","dismantle",
    "disparity","dissuade","divert","docile","dominate","dormant","dubious","duplicity","earnest","eccentric",
    "egregious","elicit","eloquent","embellish","eminent","empathy","endorse","engross","enumerate","erratic",
    "evade","exalt","exasperate","exemplify","exert","exorbitant","expedient","explicit","extol","exuberant",
]

# deduplicate each list
g10 = sorted(set(w.lower() for w in grade10))
g11_raw = sorted(set(w.lower() for w in grade11))
g12_raw = sorted(set(w.lower() for w in grade12))

# remove grade10 words from grade11
g11 = [w for w in g11_raw if w not in set(g10)]

# remove grade10+11 words from grade12
used = set(g10) | set(g11)
g12 = [w for w in g12_raw if w not in used]

print(f"Grade 10: {len(g10)} words")
print(f"Grade 11: {len(g11)} words")
print(f"Grade 12: {len(g12)} words")

with open(os.path.join(base, "05_高一新增.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(g10) + "\n")

with open(os.path.join(base, "06_高二新增.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(g11) + "\n")

with open(os.path.join(base, "07_高三新增.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(g12) + "\n")

print("Done.")
