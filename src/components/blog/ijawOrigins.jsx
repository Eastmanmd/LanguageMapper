import { Link } from 'react-router-dom'
import BlogPost from './BlogPost'
import { Li, P, Ul } from './prose'

// Listed in the order they are first cited, so the numbers read upwards.
const SOURCES = [
  {
    id: 'wiki-nc',
    text: 'Wikipedia, “Niger–Congo languages” (speaker estimate).',
    url: 'https://en.wikipedia.org/wiki/Niger%E2%80%93Congo_languages',
  },
  {
    id: 'ariye',
    text: 'Ariye, E. C. 2013. “The Ijo (Ijaw) People of Delta State: Their Early History and Aspects of Social and Cultural Practices.” Historical Research Letter 8.',
    url: 'https://www.academia.edu/99575677/The_Ijo_Ijaw_People_of_Delta_State_Their_Early_History_and_Aspects_of_Social_and_Cultural_Practices',
  },
  {
    id: 'connell',
    text: 'Connell, B. “The Defaka – Ịjọ relationship revisited.” Abstract, World Congress of African Linguistics, Cologne.',
    url: 'https://www.uni-koeln.de/phil-fak/afrikanistik/wocal/schedule/abstracts/8-7-2%20Bruce%20Connell.pdf',
  },
  {
    id: 'wiki-krumen',
    text: 'Wikipedia, “Krumen people.”',
    url: 'https://en.wikipedia.org/wiki/Krumen_people',
  },
  {
    id: 'crutcher',
    text: 'Crutcher, M. 2023. “For King and Empire: The Changing Political, Economic, and Cultural Identities of Kru Mariners in Atlantic Africa, 1460–1945.” Journal of African History 64(3): 437–448.',
    url: 'https://ircommons.uwf.edu/esploro/outputs/journalArticle/For-King-and-Empire-The-Changing/99381852696906600',
  },
  {
    id: 'gunn',
    text: 'Gunn, J. 2021. Outsourcing African Labor: Kru Migratory Workers in Global Ports, Estates and Battlefields until the End of the 19th Century. De Gruyter Oldenbourg.',
    url: 'https://www.degruyterbrill.com/document/doi/10.1515/9783110680331/pdf',
  },
  {
    id: 'wiki-dogon',
    text: 'Wikipedia, “Dogon languages” (Blench on classification and word order).',
    url: 'https://en.wikipedia.org/wiki/Dogon_languages',
  },
  {
    id: 'blench-roots',
    text: 'Blench, R. 2016. “Supposing we have been completely wrong about the shape of early Niger-Congo roots?” Draft circulated for comment.',
    url: 'https://llacan.cnrs.fr/nigercongo2/presentations/Blench-NC%20three%20consonant%20roots.pdf',
  },
  {
    id: 'good',
    text: 'Good, J. 2018. “Niger-Congo languages.” Annotated bibliography, draft of 1 May 2018.',
    url: 'https://www.acsu.buffalo.edu/~jcgood/jcgood-NigerCongo-Draft.pdf',
  },
  {
    id: 'joshi',
    text: 'Joshi, E. et al. 2023. “Whole-genome sequencing across 449 samples spanning 47 ethnolinguistic groups provides insights into genetic diversity in Nigeria.” Cell Genomics. Link is to the open preprint.',
    url: 'https://www.biorxiv.org/content/10.1101/2022.12.09.519178v3.full',
  },
  {
    id: 'cole',
    text: 'Cole-Showers, C. L. 2014. “Population structure and demographics in Nigerian populations utilizing Y-chromosome markers.” Thesis, University of the Western Cape.',
    url: 'https://uwcscholar.uwc.ac.za/items/2d9dd2e5-0a4a-4fc8-981a-3eb33dfc63d1',
  },
  {
    id: '23andme',
    text: '23andMe. 2022. Blog post announcing new African ethnolinguistic reference groups, including “Edo & Ijaw peoples.”',
    url: 'https://blog.23andme.com/articles/african-ethnolinguistic-groups',
  },
  {
    id: 'bird',
    text: 'Bird, N. et al. 2023. “Dense sampling of ethnic groups within African countries reveals fine-scale genetic structure and extensive historical admixture.” Science Advances 9(13): eabq2616.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10058250/',
  },
  {
    id: 'defilippo',
    text: 'de Filippo, C. et al. 2011. “Y-chromosomal variation in Sub-Saharan Africa: insights into the history of Niger-Congo groups.” Molecular Biology and Evolution 28(3): 1255–1269.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3561512/',
  },
  {
    id: 'patrilocality',
    text: '“Impact of patrilocality on contrasting patterns of paternal and maternal heritage in Central-West Africa.” 2024. Scientific Reports.',
    url: 'https://www.nature.com/articles/s41598-024-65428-z',
  },
  {
    id: 'derefaka',
    text: 'Gundu, Z. A. 2008. Review of A. A. Derefaka, Archaeology and Culture History in the Central Niger Delta (2003). African Diaspora Archaeology Newsletter, June 2008.',
    url: 'http://www.diaspora.illinois.edu/news0608/news0608-19.pdf',
  },
  {
    id: 'blench-geo',
    text: 'Blench, R. 2012. “Understanding Nigerian prehistory through its linguistic geography.” In R. Blench & S. McGill (eds), Advances in Minority Language Research in Nigeria, vol. 1, 19–38. Köln: Rüdiger Köppe.',
    url: 'https://rogerblench.info/files/archaeology/africa/blench%202012%20offprint%20linguistic%20geography.pdf',
  },
  {
    id: 'oru-ijo',
    text: 'Ijaw World Studies, “Little Known Facts About the Ijaws #10” (on Oru as a name for the Ijo; a community source).',
    url: 'https://www.ijawworldstudies.com/the-ijos-the-orus-orubo/',
  },
  {
    id: 'oru-igbo',
    text: 'Onumonu. Article on kingship among the Oru-Igbo. African Journals Online.',
    url: 'https://ajol.info/index.php/og/article/view/141242/130976',
  },
  {
    id: 'wiki-mande',
    text: 'Wikipedia, “Mande languages” (Dimmendaal and Güldemann on its classification; Vydrin for the opposing evidence).',
    url: 'https://en.wikipedia.org/wiki/Mande_languages',
  },
  {
    id: 'wiki-bangime',
    text: 'Wikipedia, “Bangime language.”',
    url: 'https://en.wikipedia.org/wiki/Bangime_language',
  },
  {
    id: 'wiki-jalaa',
    text: 'Wikipedia, “Jalaa language.”',
    url: 'https://en.wikipedia.org/wiki/Jalaa_language',
  },
]

function Cite({ id }) {
  const n = SOURCES.findIndex((source) => source.id === id) + 1
  // The word joiner keeps the number on the same line as the word before it.
  return (
    <>
      {'⁠'}
      <sup className="ml-0.5 leading-none">
        <a
          href={`#source-${id}`}
          aria-label={`Source ${n}`}
          className="text-naija-700 no-underline hover:underline dark:text-naija-400"
        >
          [{n}]
        </a>
      </sup>
    </>
  )
}

const POST = {
  title: 'Where did the Ijaw languages come from?',
  dek: 'A people of the Niger Delta, a language family with no clear relatives, and what the evidence can tell us.',
  date: '31 October 2026',
  sources: SOURCES,
  intro: (
    <>
      <P>
        A few million people speak Ijaw in the creeks and mangroves of the Niger
        Delta.<Cite id="wiki-nc" /> Their languages are among the hardest in West Africa to place.
        The verb usually comes last in the sentence, which is rare for the region, and there is none
        of the noun-class system found across much of Niger-Congo. Ijaw has lived beside Igbo, Edo
        and Yoruba-related languages for a long time, yet it is not close to any of them.
      </P>
      <P>
        So where did it come from? Nobody knows for certain. This post goes through the main clues,
        says how strong each one is, and ends with the story that best fits them.
      </P>
    </>
  ),
  sections: [
    {
      heading: 'A people of the water',
      status: { label: 'Well established', tone: 'strong' },
      body: (
        <>
          <P>
            The Delta has three belts: sandy beach ridges, salt-water mangrove swamp and freshwater
            swamp. Ijaw communities live in all three.<Cite id="ariye" />
          </P>
          <P>
            Language and identity do not line up neatly here. Linguists call the language family
            Ijoid, but some people who identify as Ijaw speak Edoid or Cross River languages instead.
            Others speak Defaka, a small language usually grouped with Ijoid that may in fact be an
            isolate.<Cite id="connell" /> It deserves its own post. What all Ijaw people share is not
            a language but closeness to the rivers and creeks of southern Nigeria.
          </P>
        </>
      ),
    },
    {
      heading: 'The Kru men',
      status: { label: 'Real history, but no evidence of shared ancestry', tone: 'mixed' },
      body: (
        <>
          <P>
            While scrolling on Twitter (X), I came across Ijaw users shocked by similarities in
            culture and speech between Ijaw and the Kru languages further west along the coast. Are
            the two connected?
          </P>
          <P>
            The Kru come from the coast of Liberia and Côte d’Ivoire. From the late 1700s their men
            worked on European ships, and “Kruman” became a recognised maritime identity that drew in
            people from many backgrounds.<Cite id="wiki-krumen" />
            <Cite id="crutcher" /> In the 1800s palm-oil trade, Kru workers served as stevedores,
            porters and boatmen in the Oil Rivers, and formed settled communities at Bonny and
            Calabar.<Cite id="gunn" /> Bonny is an Ijo town whose language the{' '}
            <Link
              to="/atlas"
              className="font-medium text-naija-700 underline decoration-naija-700/30 underline-offset-2 hover:decoration-naija-700 dark:text-naija-400 dark:decoration-naija-400/40 dark:hover:decoration-naija-400"
            >
              Africa atlas
            </Link>{' '}
            lists as Ibani. So these two water peoples really did meet, but in the nineteenth
            century, far too late to explain where Ijaw came from.
          </P>
          <P>
            Could Ijoid instead descend from much earlier Kru settlers? I found no evidence for
            that, and no study comparing the two language groups in detail.
          </P>
        </>
      ),
    },
    {
      heading: 'A link with Dogon?',
      status: { label: 'Weak: shared oddities, not demonstrated kinship', tone: 'weak' },
      body: (
        <>
          <P>
            Dogon is a group of around twenty languages centred on the Bandiagara escarpment in
            Mali, some 1,500 km from the Delta. It comes up because Dogon and Ijoid both put the verb
            last and have no noun classes. But Mande shares the same word order,
            <Cite id="wiki-dogon" /> so this does not single them out as a pair.
          </P>
          <P>
            The most interesting argument is Roger Blench’s. In a draft paper, he notes that both
            keep unusually long three-syllable word roots, and suggests these preserve the shape of
            early Niger-Congo words.<Cite id="blench-roots" /> That would make them two old branches
            of one big family, not close sisters. Jeff Good’s survey of the field says Mande, Ijoid
            and Dogon are not thought to be closely related to one another,
            <Cite id="good" /> and I found no published study arguing for a Dogon-Ijaw subgroup.
          </P>
        </>
      ),
    },
    {
      heading: 'What the genes say',
      status: { label: 'Very little data so far', tone: 'weak' },
      body: (
        <>
          <P>
            I could not find any published genetic study designed to trace Ijaw origins. What exists
            comes mostly from wider surveys of Nigeria.
          </P>
          <Ul>
            <Li>
              A 2023 whole-genome study of 449 people from 47 Nigerian groups included Izon people.
              They clustered with Yoruba, Igbo, Ibibio and Bini.<Cite id="joshi" />
            </Li>
            <Li>
              A 2014 thesis on Y chromosomes included just 15 Ijaw men, and grouped them with other
              southern Niger-Congo speakers.<Cite id="cole" />
            </Li>
            <Li>
              23andMe groups Edo and Ijaw peoples together in one reference
              group.<Cite id="23andme" /> That hints at similarity, but it is a commercial product
              and its samples may be limited.
            </Li>
            <Li>
              Other large surveys either did not sample the Ijaw or do not name them in their main
              text.<Cite id="bird" />
              <Cite id="defilippo" />
              <Cite id="patrilocality" />
            </Li>
          </Ul>
          <P>
            So, on small samples, Ijaw people look genetically much like their neighbours, even
            though their language does not. That is common, since genes and languages can travel
            separately. Intermarriage could explain it, but so could shared deep ancestry, and the
            data cannot yet tell these apart.
          </P>
        </>
      ),
    },
    {
      heading: 'The most likely origin story',
      status: { label: 'My best reconstruction, not settled fact', tone: 'mixed' },
      body: (
        <>
          <P>
            Ijoid is an old language family with no demonstrated close relatives among the languages
            around it.<Cite id="good" /> Its split from other West African languages is probably much
            older than its speakers’ settlement in the creeks. One often-quoted estimate puts the
            split from Yoruba and Igbo at about 7,000 years ago, though such dates are
            rough.<Cite id="derefaka" /> Yet the Ijo languages are very close to one another, which
            suggests they spread through the Delta fairly recently.<Cite id="blench-geo" /> So the
            creeks probably cannot tell us where Ijoid began, only why it survived.
          </P>
          <P>
            Where it began is still unknown. Migration pressure from Yoruboid, Edoid, Akoko and
            Igboid (YEAI) and other Benue-Congo groups may have pushed Ijoid speakers towards the
            coast. Or, as Blench proposes, they may have been river fishers who moved into the Delta
            to live off the water.<Cite id="blench-geo" /> Both could be partly true, and I know of no
            study that tests them directly.
          </P>
          <P>
            Either way, the creeks offered a refuge. They are hard to navigate even today, which
            would have discouraged large-scale settlement from outside and made complete language
            shift less likely. Refuge does not mean isolation, though. Ijaw and Igbo appear to have
            influenced each other, most visibly in Kalabari and Ibani (both Ijoid) and in Ikwerre and
            Ekpeye (both Igboid).
          </P>
          <P>
            Readers should also watch out for the name Oru. It has been used for the
            Ijo<Cite id="oru-ijo" /> and, as Oru-Igbo, for riverine Igbo
            communities,<Cite id="oru-igbo" /> so older accounts of the “Oru” are not always clear
            about which group they mean.
          </P>
          <P>
            Ijoid is also a reminder of how diverse West Africa’s languages are. Mande, which some
            linguists now treat as separate from Niger-Congo,<Cite id="wiki-mande" /> Songhay in Mali,
            Niger and Burkina Faso, and Saharan in northern Nigeria, Niger and Chad all point to
            several distinct language lines. Small languages with no close relatives, such as
            Bangime in Mali<Cite id="wiki-bangime" /> and Jalaa in Nigeria,
            <Cite id="wiki-jalaa" /> hint at others that have almost disappeared. Ijoid may be
            another survivor of that older diversity.
          </P>
          <P>
            One last note: identity has become much more rigid in Nigeria, and in Africa as a whole,
            but it may once have been continuous, just as genetics is. There is no “pure” Ijoid group,
            language or set of genes. What we have are pieces of a puzzle that can point to who our
            ancestors once were.
          </P>
        </>
      ),
    },
  ],
}

export default function IjawOrigins() {
  return <BlogPost post={POST} />
}
