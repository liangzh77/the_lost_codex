"""生成各级别英文单词列表文件"""
import os

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "wordlists")
os.makedirs(OUT, exist_ok=True)

# 初一新增 ~300
grade7 = """achieve balance courage develop environment foreign grammar honest imagine journey
knowledge library medicine natural opinion patient respect similar temperature uniform
vacation adventure afford agriculture although ancient announce anxiety apologize appearance
application argument arrange article atmosphere attempt attitude audience available average
award background basic battery behavior belong beyond billion blank blind block blood bomb
bone border bother bottom brain branch brave breath bridge brief broad budget burn bury
cabinet calculate calendar campaign cancel capable capital capture career carpet casual
category celebrate ceremony chain challenge champion channel chapter character charity chart
chase cheap cheat chemical chest chief childhood choice citizen civil claim classic climate
clinic coach coast code collect colony column combine comedy comfort command comment commercial
commit committee common companion compare compete complain complete complex concentrate concern
conclusion condition conference confidence confirm conflict confuse connect conscious consequence
consider consist constant construct consult contact contain content contest context continue
contract contribute control convenient conversation convince cooperate correct correspond costume
cottage council counter couple court cousin crash create creature credit crew crime crisis
critical crop crowd cruel culture curious current custom cycle damage debate decade decision
declare decline decorate decrease defeat defend define degree delay deliver demand department
depend deposit depress describe desert deserve design desire despite destination destroy detail
detect determine device devote dialogue diamond diet differ digital direct disappear disappoint
disaster discipline discount discover discuss disease display distance district disturb divide
document domestic donate double doubt downtown draft drama drawer drought due dull dump duty
eager earn earthquake economy edition editor educate effect effort election electric element
emergency emotion employ enable encounter encourage energy engine enormous ensure entire entrance
entry equal equipment escape especially essential establish evaluate event eventually evidence
evil exact examine excellent except exchange excite excuse exercise exhibit exist expand expect
expense experience experiment expert explain explode explore export expose express extend extra
extreme facility factor failure faith familiar fancy fantasy fare fashion fault favor feature
federal fee female fence festival fiction fierce figure file final finance firm flag flame flash
flat flavor flesh flight float flood flour flow focus folk forbid force forecast forever forgive
formal former formula fortune forward fossil foundation frame freedom frequent frighten frontier
fuel function fund funeral furniture gallery gap garage gather gender general generate gentle
genuine gesture giant global glory govern grab grace gradual grain grand grant grateful grave
gravity greet grocery guarantee guard guide guilty"""

# 初二新增 ~300
grade8 = """absorb accompany accomplish accurate accuse adapt adequate adjust administration
admire adopt advance advantage advertise advocate aggressive aid aim alarm alert allocate
alongside alter alternative amaze ambition amuse analyze ancestor angle annual anticipate
apparent appeal appetite applaud appreciate approach approval approve approximate arch arise
armor artificial ashamed aspect assemble assert assess assign assist associate assume assure
astonish attach attain attract authority automatic automobile await awake awkward bachelor
backward bacteria badge ban bargain barrier basis behalf bend beneath benefit betray bid bind
biography bitter blade blame blast bleed blend bless bloom blow boast bold bonus boost bound
boundary bow brand breakdown breed brilliant broadcast browse brutal bubble burden burst
calculate calm canal candidate carbon caution cease census chamber chaos characteristic charm
circuit circumstance civilization clarify classify cling clinical clip clue cluster collapse
colleague combat commence commission communicate compact companion comparison compel compensate
compile complement compose comprehensive compromise compulsory conceal conceive concrete
condemn conduct confess confine confront congress conquer consent conservation conservative
considerable consistent constitute consult consume contemporary contempt contradiction
controversial convention convert convey cooperate coordinate cope core corporate correspond
council counsel coverage crack craft crash crawl creative criminal cultivate cure curiosity
curriculum dairy dare database deadline debate debt decent declaration decline dedicate deem
defeat defect deficit define definite deliberate delicate democracy demonstrate dense deny
departure depression derive descend deserve desktop desperate destiny detect device diagram
differ digest dilemma dimension diminish diplomat disability disagree discipline disclose
disguise dismiss disorder display dispute dissolve distinct distribute diverse divorce
document domain dominant draft dramatic drift dwell dynamic ease echo ecology editorial
elaborate elect elegant eliminate embrace emission emphasize empire encounter endure enforce
engage enhance enormous enterprise enthusiasm entity envelope episode equality era erect
error essay eternal evaluate evident evolution exaggerate exceed exception excessive exclude
exclusive execute exhaust exhibit expand expedition expenditure expertise explicit exploit
explosion extent external extract extraordinary fabric facilitate fade faint faithful fame
fatal fatigue feast feedback fertile fiber fierce filter finance flaw flee flexible flip
flourish fluid fold fond forecast forge format forth fossil fraction fragment framework
fraud freeze friction fulfill fundamental furnish fuse gallery gamble gaze gear generous
genetic genius globe gorgeous gossip govern grace gradual graphic grasp grave grieve grip
gross guarantee guidance guilty gymnasium halt handful handsome hardware harmony harsh
harvest hatred haunt headquarters heal heap heritage hesitate highlight hint hollow hook
horizon hostile household humanity humble hurricane identical ideology ignorance illustrate
immense immune implement implication implicit impose impulse incentive incident incline
incorporate incredible index indicate indifferent inevitable infant inflation infrastructure
inhabit initial inject innovation input inquiry insert insight insist inspection install
instance institute institution instrument insult insurance integrate intellectual intense
intention interact interfere interior internal interpret interval intimate invade invasion
invest investigate invisible involve irony isolate"""

# 初三新增 ~300
grade9 = """abandon abstract accelerate access accommodate accumulate acknowledge acquire
adequate adhere adjacent administer adolescent advocate affiliate agenda aggression agony
alien alignment allegation alleviate alliance alongside amateur ambassador ambiguous amid
ample analogy anchor anonymous apparatus appetite appliance appraisal apt arena array
articulate aspire assault assemble assert asset assign assimilate associate assure asylum
authorize autonomous avail aviation axis bachelor ballot bandwidth bargain barrel batch
behalf benchmark bias biography bizarre blend blueprint bold boom bounce boundary breach
breed brochure broker bronze brutal bulk burden bureaucracy cabin cabinet calendar campaign
canal candidate capability carbon cargo catalog caution cease census charter chronic chunk
circulate cite civilian clarity clash clause client cluster coalition cognitive coincide
collaborate collective combat commence commentary commission commodity compact compatible
compel compensate compile complement comply component comprehensive comprise compromise
compulsory conceive concrete concurrent condemn confer confine conform confront congress
conscience consensus consent consequent conservation constitute constraint consult contemplate
contemporary contend contest contradict contrary contrast controversy convene convention
convert convict cooperate coordinate copyright core corporate correlate correspond counsel
counterpart courtesy coverage craft credential crew criterion crucial crude crush cultivate
cumulative curriculum custody database deadline debris decay decent decisive declaration
dedicate deem default defect deficit delegate deliberate demographic denial dense deploy
deposit deprive derive designate desktop detect deteriorate devise devote diagnose dictate
differentiate digest dilemma dimension diminish diplomat directory discard discharge disclose
discourse discrete discrimination dismiss disorder dispatch displace disposal dispose
dispute disrupt dissolve distinct distort distribute diverse divert doctrine domain dominant
donate dose draft drain dramatic drift duration dwell dynamic ease echo ecology editorial
elaborate eligible eliminate embrace emission emit emphasize empire empirical enable enact
encounter endorse endure enforce engage enhance enterprise entity entrepreneur envelope
episode equip equivalent erode escalate essence estate ethical evaluate eventual evidence
evolve exceed excess exclude exclusive execute exempt exert exhaust exotic expedition
expertise explicit exploit export expose extract extraordinary facilitate faculty famine
fascinate fatal feasible federal feedback fiber fierce fiscal flaw fleet flexible flourish
fluctuate fluid forecast forge format formula forth foster fraction fragment framework
franchise fraud freight friction frontier frustrate fulfill fundamental furnish fusion
galaxy gauge gear gender generate genetic genius genuine gesture globe gorgeous grace
graphic grasp grave gravity grip gross guideline habitat halt handful hardware harmony
harsh harvest hazard headquarters heritage hierarchy highlight hormone hostile household
humanitarian humble hypothesis identical ideology ignorance immense immune implement
implicit impose impulse inadequate incentive incidence incline incorporate incredible
index indicate indigenous induce inevitable infant inflation infrastructure inherent
inhibit initial inject innovation input inquiry insight inspect install instance institute
integral integrate integrity intellectual intense interact interfere intermediate internal
interpret interval intimate intrinsic invade inventory invest investigate invisible invoke
irony isolate journal judicial junction justify keen label landscape laser latter launch
layer layout league legislation legitimate leisure liberal likewise limb linear linguistic
literacy lobby logic lone loyal luxury magnetic magnificent mainstream maintenance mandate
manifest manipulate manual manuscript margin marine mature maximize mechanism media
mediate medium membrane mental mentor merchant mere methodology migrate military minimal
ministry minor miracle mobile mode moderate modify molecule momentum monitor monopoly
moreover mortgage motivate mount multiple municipal mutual myth narrative negotiate neutral
nevertheless nominal nonetheless norm notable notify notion notwithstanding nuclear numerous
nutrition objective obligation obscure obstacle obtain obvious occupation odds offset ongoing
opponent optical optimistic option orbit orient orphan outbreak outcome outlet output overall
overcome overlap overseas overwhelming oxygen"""

# 托福 ~500
toefl = """abiotic abrasion accretion acidity adaptation adhesion aerobic aggregate algae
alluvial altimeter amalgamate ambient amphibian anaerobic anatomy anthropology aquifer
arable archaeology arid artifact assay asteroid atmosphere atrophy auditory aurora
autotroph avalanche avian axis bacterium barometer basalt biodiversity biome biosphere
bivalve boreal botanical brackish buoyancy calcify canopy carbon carnivore cartography
catalyst celestial cellulose centrifugal chlorophyll chromosome chronology clay coalesce
combustion commensalism condensation conduction conifer conservation continental convection
convergent coral correlation cortex cosmology crater cretaceous crust crystalline
curriculum debris deciduous decompose deforestation delta demographic dendrite density
deposition desalination desiccation diatom diffusion dinosaur discharge disperse dissolve
distillation divergent domesticate dormant drainage drought dune earthquake ecology
ecosystem electrode elevation embryo emission endemic endothermic enzyme epoch equator
equilibrium erosion eruption estuary eutrophication evaporation evolution excavation
exoskeleton extinction extrusive fauna fern fertile fission flora fluorescent foliage
formation fossil fracture frequency friction fungus galaxy gene genetics geology geothermal
germinate glacier glucose gorge granite grassland greenhouse groundwater habitat hemisphere
herbivore heredity hibernate homogeneous hormone humidity humus hybrid hydraulic hydrogen
hydrology hypothesis iceberg igneous immunity incubate indigenous inertia infrared
insectivore insolation invertebrate ion irrigation isotope juvenile kinetic lagoon larva
latitude lava lichen limestone lithosphere longitude luminous lunar magma mammal mangrove
mantle marine marsh membrane meridian mesa metabolism metamorphic meteorology microbe
migration mineral molecule mollusk monsoon moraine morphology moss mutation mutualism
nebula nectar niche nitrogen nocturnal nucleus nutrient observatory omnivore orbit ore
organism osmosis outcrop oxidation ozone paleontology parasite peninsula permafrost
permeability petrify photosynthesis phylum pigment plankton plateau pollen pollinate
polymer population prairie precipitation predator primate probe prokaryote propagation
protein proton proximity pulsar quarantine quartz radiation radioactive reef refraction
regeneration reproduction reptile reservoir respiration rift rotation runoff salinity
satellite savanna sediment seismic semiconductor sequoia silt simulate solar solstice
soluble sonar species specimen spectrum spore stalactite stalagmite stamen steppe stimulus
stratosphere stratum subduction substrate succession sulfur symbiosis synthesis tectonic
temperate terrestrial thermodynamics tidal topography toxin transpiration tributary
tropical troposphere tsunami tundra turbine ultraviolet understory uranium vegetation
velocity vertebrate volcanic watershed weathering wetland zoology aeration allele
amplitude anomaly aquatic archipelago aurora bedrock benthic biogeography biomass
caldera canopy capillary carnivorous cavity circumference coexistence colonization
combustible confluence coniferous continental crevasse crust cultivar deciduous
decomposition deforestation desertification dew dormancy drought ecosystem elevation
emission endemic erosion estuary evapotranspiration exfoliation extinction fauna
fermentation fissure floodplain fluorescence foliage fossilization geomorphology
germination glaciation gradient groundwater gyre habitat herbaceous heterogeneous
hibernation homologous humidity hydroelectric hypothesis igneous indigenous infiltration
insulation invertebrate ionosphere irrigation isthmus karst kinetic landform latitude
leaching lichen lithification longitude magma mantle maritime metamorphism microorganism
migration mineral monsoon moraine morphology mutation niche nitrogen nocturnal nutrient
oceanography omnivorous orbit organic oscillation outcrop oxidation paleontology parasitism
peninsula permafrost photosynthesis phytoplankton plateau pollination precipitation
predation primate prokaryote radiation reef regeneration reproduction respiration
salinization satellite sedimentary seismology silicate simulation solar speciation
stratification subduction succession symbiosis taxonomy temperate terrestrial thermosphere
topography transpiration tributary tropism tundra ultraviolet vegetation volcanic
watershed weathering"""

# 雅思 ~500
ielts = """aboriginal abundance accessible accommodate accountability accreditation
accumulate acquaintance acupuncture addictive adjacent adolescence advent adverse advocacy
aesthetic affiliation affluent agenda aggression agile albeit alignment allegation alleviate
allocation alongside alteration altitude ambiguity amendment amid amplify analogy anecdote
animation anomaly anticipation apparatus apprehension apprenticeship aptitude arbitrary
arena articulate aspiration assertion assessment assimilation assumption attainment
attribute audit authentic authorization autonomy backdrop bankruptcy benchmark bilateral
biodegradable blueprint booming breakthrough bureaucratic calibrate capability carbon
catastrophe census chronic circulation civic clarity coalition cognitive collaboration
commemorate commodity communal compelling competence complement compliance component
comprehensive compulsory conceivable configuration confinement congestion consecutive
conservation consolidation consortium constraint consultation contamination contemplation
contemporary contention contingency contradiction controversial convention conversion
conviction coordination correlation correspondence counterpart credibility criterion
culmination curriculum customary database debatable decentralization deficit degradation
delegation demographic depiction deprivation deregulation designation deterioration
deviation diagnosis differentiation dilemma dimension diplomatic discourse discretion
discrimination displacement disposition disruption dissemination distinction diversity
documentation domain dominance donation dormitory downfall drainage drastic duration
ecological elaborate electoral elimination emission empowerment enactment endorsement
enforcement enhancement enterprise entity entrepreneurial epidemic equitable equivalent
erosion escalation establishment ethical evaluation eventual evolution exacerbate
excavation exclusion exemption exhaustion exhibition expansion expedition expertise
exploitation exploration exponential extraction fabrication facilitation faculty
feasibility federation fiscal fluctuation foreseeable formulation fossil fragmentation
framework franchise fraud frequency friction fulfillment functionality fundamental
furthermore gender generic genetic geographic globalization governance gradient
greenhouse grievance groundbreaking habitat harassment hazardous heritage hierarchy
humanitarian hypothesis identical ideology illiteracy immigration immunity implementation
implication incentive incidence inclination incorporation indication indigenous
industrialization inequality inflation infrastructure inhabitant initiative innovation
inspection installation institutional integration integrity intellectual interaction
interference interpretation intervention intimidation intrinsic investigation irrigation
isolation jurisdiction justification kinetic landmark landscape legislation legitimate
leverage liability likelihood limitation linguistic literacy livelihood logistics
longevity magnitude mainstream maintenance malnutrition mandate manifestation manipulation
manuscript marginal maritime mechanism mediation merchandise methodology metropolitan
migration milestone minimal ministry mobility modification monetary monopoly mortality
motivation municipal narrative negligence negotiation networking neutrality nomination
nonetheless norm notable notification notwithstanding nutrition obesity obligation
observation obstacle occupation occurrence offensive ongoing operational optimization
orientation outbreak outreach output outstanding overall overhaul overlap oversight
participation partnership patent penetration perception periodical permanent persecution
perspective petition pharmaceutical phenomenon pioneer placement plantation plausible
polarization portfolio postponement practitioner precaution predominantly preliminary
premium prescription preservation prevalence prevention primarily privatization
procurement productivity proficiency prohibition projection prominence promotion
proportion prosecution prospective protocol provision proximity publication pursuit
qualification quota ratification rationale recession recommendation reconciliation
recruitment referendum refinement reformation regime regulation rehabilitation
reinforcement relevance reliance reluctance remedy renovation replication representation
reproduction requirement residential resilience resolution restoration restriction
retention retrieval revelation revenue revision revolution rigorous rural sanction
scenario scrutiny sector segment segregation seminar sensitivity settlement shortage
significance simulation skepticism solidarity sophistication specification spectrum
sponsorship stability stakeholder standardization statistic stereotype stimulation
strategic submission subordinate subsidy substantial succession sufficiency supervision
supplement surveillance sustainability symbolic tariff technological tenure terminology
territorial testimony therapeutic threshold tolerance trajectory transaction transformation
transmission transparency tribunal trigger turnover unanimous underlying unemployment
unification unprecedented upgrade urbanization utilization validity variation vegetation
venture verification versatile violation virtual visibility voluntary vulnerability
warehouse welfare withdrawal workforce"""

def write_list(filename, words_str):
    words = [w.strip() for w in words_str.split() if w.strip()]
    # 去重保持顺序
    seen = set()
    unique = []
    for w in words:
        wl = w.lower()
        if wl not in seen:
            seen.add(wl)
            unique.append(wl)
    path = os.path.join(OUT, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(unique) + "\n")
    print(f"{filename}: {len(unique)} words")

write_list("02_初一新增.txt", grade7)
write_list("03_初二新增.txt", grade8)
write_list("04_初三新增.txt", grade9)
write_list("10_托福.txt", toefl)
write_list("11_雅思.txt", ielts)
