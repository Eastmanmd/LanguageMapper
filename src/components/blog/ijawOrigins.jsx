import { Link } from 'react-router-dom'
import BlogPost from './BlogPost'
import { Li, Ol, P, Ul } from './prose'

// Listed in the order they are first cited, so the numbers read upwards.
const SOURCES = [
  {
    id: 'wiki-nc',
    text: 'Wikipedia, “Niger–Congo languages” (speaker estimate; summary of Glottolog’s position).',
    url: 'https://en.wikipedia.org/wiki/Niger%E2%80%93Congo_languages',
  },
  {
    id: 'good',
    text: 'Good, J. 2018. “Niger-Congo languages.” Annotated bibliography, draft of 1 May 2018.',
    url: 'https://www.acsu.buffalo.edu/~jcgood/jcgood-NigerCongo-Draft.pdf',
  },
  {
    id: 'ariye',
    text: 'Ariye, E. C. 2013. “The Ijo (Ijaw) People of Delta State: Their Early History and Aspects of Social and Cultural Practices.” Historical Research Letter 8. Summarises Alagoa (1972) and Horton (1997).',
    url: 'https://www.academia.edu/99575677/The_Ijo_Ijaw_People_of_Delta_State_Their_Early_History_and_Aspects_of_Social_and_Cultural_Practices',
  },
  {
    id: 'alagoa',
    text: 'Alagoa, E. J. 1970. “Long-Distance Trade and States in the Niger Delta.” Journal of African History 11(3): 319–329.',
    url: 'https://www.cambridge.org/core/journals/journal-of-african-history/article/abs/longdistance-trade-and-states-in-the-niger-delta/4A44A1B411C835F3CA4EC38958899214',
  },
  {
    id: 'pereira',
    text: 'Pacheco Pereira, D. Esmeraldo de Situ Orbis, written c. 1505–1508. Trans. G. H. T. Kimble, Hakluyt Society, 1937. Cited by Alagoa (1970); link is to a summary on Wikipedia.',
    url: 'https://en.wikipedia.org/wiki/Esmeraldo_de_Situ_Orbis',
  },
  {
    id: 'derefaka',
    text: 'Gundu, Z. A. 2008. Review of A. A. Derefaka, Archaeology and Culture History in the Central Niger Delta (2003). African Diaspora Archaeology Newsletter, June 2008.',
    url: 'http://www.diaspora.illinois.edu/news0608/news0608-19.pdf',
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
    id: 'izon',
    text: 'Alagoa, E. J., T. N. Tamuno & J. P. Clark (eds). 2009. The Izon of the Niger Delta. Onyoma Research Publications. Reports the Ogula tradition recorded by Hook.',
    url: 'https://www.africanbookscollective.com/books/the-izon-of-the-niger-delta',
  },
  {
    id: 'wiki-kwa',
    text: 'Wikipedia, “Kwa languages” (Greenberg 1963 and Stewart 1989 on Kru and Ijaw).',
    url: 'https://en.wikipedia.org/wiki/Kwa_languages',
  },
  {
    id: 'wiki-kru',
    text: 'Wikipedia, “Kru languages” (Marchese 1989 on word order; Güldemann 2018 on classification).',
    url: 'https://en.wikipedia.org/wiki/Kru_languages',
  },
  {
    id: 'wiki-gola',
    text: 'Wikipedia, “Gola language” (Segerer & Lionnet 2010; Fields 2004).',
    url: 'https://en.wikipedia.org/wiki/Gola_language',
  },
  {
    id: 'wiki-aizi',
    text: 'Wikipedia, “Aizi languages.”',
    url: 'https://en.wikipedia.org/wiki/Aizi_languages',
  },
  {
    id: 'ega',
    text: '“The Ega language of Côte d’Ivoire: how can it be classified?” Paper on Academia.edu.',
    url: 'https://www.academia.edu/33800011/The_Ega_language_of_Cote_dIvoire_how_can_it_be_classified',
  },
  {
    id: 'wiki-mpra',
    text: 'Wikipedia, “Mpra language” (Painter 1967; Blench on its status).',
    url: 'https://en.wikipedia.org/wiki/Mpra_language',
  },
  {
    id: 'wiki-pere',
    text: 'Wikipedia, “Mbre language.”',
    url: 'https://en.wikipedia.org/wiki/Mbre_language',
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
    id: 'bangande',
    text: '“Striking Genetic Diversity Among Populations of West Africa Uncovers the Mystery of a Language Isolate.” 2020. Preprint, SSRN.',
    url: 'https://www.aminer.cn/pub/6228447b5aee126c0ff8f97a/striking-genetic-diversity-among-populations-of-west-africa-uncovers-the-mystery-of',
  },
  {
    id: 'blench-geo',
    text: 'Blench, R. 2012. “Understanding Nigerian prehistory through its linguistic geography.” In R. Blench & S. McGill (eds), Advances in Minority Language Research in Nigeria, vol. 1, 19–38. Köln: Rüdiger Köppe.',
    url: 'https://rogerblench.info/files/archaeology/africa/blench%202012%20offprint%20linguistic%20geography.pdf',
  },
  {
    id: 'connell',
    text: 'Connell, B. “The Defaka – Ịjọ relationship revisited.” Abstract, World Congress of African Linguistics, Cologne.',
    url: 'https://www.uni-koeln.de/phil-fak/afrikanistik/wocal/schedule/abstracts/8-7-2%20Bruce%20Connell.pdf',
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
  dek: 'A people of the Niger Delta, a language family with no clear relatives, and what the evidence can and cannot tell us.',
  date: '30 October 2026',
  sources: SOURCES,
  intro: (
    <>
      <P>
        A few million people speak Ijaw in the creeks and mangroves of the Niger
        Delta.<Cite id="wiki-nc" /> Their languages are also among the hardest in West Africa to
        place. The verb usually comes last in the sentence, which is rare for the region, and there
        is none of the noun-class system found across much of Niger-Congo. Ijaw has lived beside
        Igbo, Edo and Yoruba-related languages for a long time, yet it is not close to any of them.
      </P>
      <P>
        So where did it come from? Nobody knows for certain. This post goes through the clues
        people most often raise, says how strong each one is, and ends with the account that best
        fits them.
      </P>
      <P>
        A word on names: Ijaw, Ijo and Izon overlap. Linguists write Ịjọ, and use Ijoid for Ijo plus
        one small and very different relative, Defaka. The{' '}
        <Link
          to="/atlas"
          className="font-medium text-naija-700 underline decoration-naija-700/30 underline-offset-2 hover:decoration-naija-700 dark:text-naija-400 dark:decoration-naija-400/40 dark:hover:decoration-naija-400"
        >
          Africa atlas
        </Link>{' '}
        on this site follows Glottolog 5.2.1 and lists ten Ijoid languages: nine Ijo and Defaka. It
        files them under Niger-Congo, but that heading is a traditional one the atlas adds for
        readers. Glottolog itself treats Ijoid as an independent family, and many linguists say the
        link to Niger-Congo has never been shown.<Cite id="good" />
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
            The Delta divides into three belts: sandy beach ridges, salt-water mangrove swamp and
            freshwater swamp. Ijaw communities live in all three, and how they live changes from
            one belt to the next.<Cite id="ariye" /> Delta states traded salt and fish north in
            exchange for farm produce, and the historian E. J. Alagoa argued that this internal
            trade helped shape them, so European commerce was not the whole story.<Cite id="alagoa" />
          </P>
          <P>
            The written record starts early. The Portuguese writer Duarte Pacheco Pereira, in the
            first decade of the 1500s, mentions a Delta people he calls the Jós, usually read as the
            Ijo.<Cite id="pereira" /> Excavated sites in the central Delta go back to about 1030 CE,
            and pollen evidence hints at farming, and so at people, by about 800
            BCE.<Cite id="derefaka" /> Pollen cannot tell us what language those people spoke.
          </P>
          <P>
            One caution about the word “coast”. The Ijaw world is a maze of rivers, creeks and
            estuaries more than it is open sea. That matters later, because these skills could have
            been learned on a great river as easily as on the ocean.
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
            The Kru come from the coast of Liberia and Côte d’Ivoire. From the late 1700s their men
            worked aboard European ships, and “Kruman” became a recognised maritime identity, one
            that drew in people from many backgrounds.<Cite id="wiki-krumen" />
            <Cite id="crutcher" /> In the 1800s palm-oil
            trade they worked as stevedores, porters and boatmen in the Oil Rivers, circulating in
            organised labour gangs and forming settled communities at Bonny and
            Calabar.<Cite id="gunn" /> Bonny is an Ijo town, speaking the language the atlas lists
            as Ibani. So two famous water peoples really did meet, but in the nineteenth century,
            which is far too late to explain where Ijaw came from.
          </P>
          <P>
            Claims of a deeper link come in two forms. Some popular websites say the Kru descend
            from the proto-Ijo, without offering evidence. There is also a tradition, recorded by
            a writer named Hook among the Iduwini Ijo around 1930, that the Ogula people were Kru
            crewmen stranded on the Delta shore. A major history of the Izon treats this as local
            speculation prompted by how different the Ogula seemed, and suggests they may in fact
            be very old in the area.<Cite id="izon" />
          </P>
          <P>
            On the language side, Joseph Greenberg did place Kru and Ijaw in one large Kwa group in
            1963, but John Stewart’s 1989 reclassification took both out
            again.<Cite id="wiki-kwa" /> Kru languages often use verb-final order alongside their
            basic subject-verb-object pattern,<Cite id="wiki-kru" /> which can look like a
            resemblance to Ijaw, but word order alone proves little. We could find no study that
            systematically compares Kru and Ijoid. Our conclusion is that a shared ancestry is
            unsupported, not disproved.
          </P>
        </>
      ),
    },
    {
      heading: 'The other puzzles along the coast',
      status: { label: 'A pattern worth noticing, not a family', tone: 'mixed' },
      body: (
        <>
          <P>
            It is tempting to imagine a chain of ancient isolates running from Liberia to the Delta.
            The real picture is patchier, and most of these languages are better described as hard
            to place than as true isolates.
          </P>
          <Ul>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">Gola</strong> (Liberia,
              Sierra Leone) may form a branch of its own, though it has also been classed with the
              Mel languages.<Cite id="wiki-gola" /> The atlas puts it directly under Atlantic-Congo,
              with no closer relatives.
            </Li>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">Aizi</strong> is really
              three languages on the Ébrié Lagoon in Côte d’Ivoire. Two are Kru. The third, Aproumu,
              was long assumed to be Kru and is now described as Kwa.<Cite id="wiki-aizi" /> The
              atlas, following Glottolog, leaves it as unclassified Volta-Congo.
            </Li>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">Ega</strong> (Côte
              d’Ivoire) has been moved in and out of Kwa. One lexical study concludes it is Western
              Kwa with heavy borrowing from Kru.<Cite id="ega" /> The atlas gives it no subgroup
              within Volta-Congo.
            </Li>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">Ghana’s coast</strong>{' '}
              has no isolate at all. Ga, Dangme, Nzima, Ahanta and Awutu all sit within Kwa in the
              atlas. The nearest puzzle is Mpra, an extinct language well inland that may be an
              isolate or a very divergent Kwa language.<Cite id="wiki-mpra" /> Pere, inland in Côte
              d’Ivoire, is similarly uncertain.<Cite id="wiki-pere" />
            </Li>
          </Ul>
          <P>
            None of these has been shown to be related to Ijaw. The idea that they are all survivors
            of an older population, from before Kwa and other groups spread, is plausible but
            speculative. Ega also shows the problem with long contact: enough borrowing can make a
            language look either stranger or more familiar than it really is.
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
            Mali, some 1,500 km from the Delta. The comparison comes up because both groups break
            the Niger-Congo mould: verb-final order and no noun classes. But Mande shares the same
            word order,<Cite id="wiki-dogon" /> so this does not single out Dogon and Ijaw as a
            pair.
          </P>
          <P>
            The most interesting argument is Roger Blench’s. In a draft paper, he notes that Dogon
            and Ijoid both keep unusually long three-syllable word roots, and proposes that these
            preserve the original shape of early Niger-Congo words, which other branches later wore
            down.<Cite id="blench-roots" /> It is worth being clear about what that claim is. It
            makes Dogon and Ijoid two conservative branches of one big family, not close sisters.
            Keeping an old feature is not evidence of a special relationship.
          </P>
          <P>
            Jeff Good’s survey of the field says Mande, Ijoid and Dogon are not thought to be closely
            related to one another, and that strong evidence tying either Ijoid or Dogon to the rest
            of Niger-Congo has not emerged.<Cite id="good" /> We found no published study arguing
            for a specific Dogon-Ijaw subgroup.
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
            Put plainly, we could not find any published genetic study designed to trace Ijaw
            origins. Almost everything available is a by-product of wider surveys of Nigeria.
          </P>
          <Ul>
            <Li>
              A 2023 whole-genome study of 449 people from 47 Nigerian groups included Izon people,
              mostly from the south-south states. They clustered with Yoruba, Igbo, Ibibio and Bini,
              with a similar mix of ancestry.<Cite id="joshi" />
            </Li>
            <Li>
              A 2014 thesis on Y chromosomes included just 15 Ijaw men. It groups them with other
              southern Niger-Congo speakers, among whom the lineage E1b1a7 predominates, and draws
              no Ijaw-specific conclusions.<Cite id="cole" />
            </Li>
            <Li>
              Other major studies do not help directly. A 2023 survey with 291 Nigerian genomes does
              not name the Ijaw in its main text,<Cite id="bird" /> and neither a 2011 Y-chromosome
              survey of Niger-Congo speakers<Cite id="defilippo" /> nor a 2024 study of the Hausa,
              Yoruba and Igbo<Cite id="patrilocality" /> sampled them.
            </Li>
          </Ul>
          <P>
            On Dogon, a 2020 preprint looks at central Mali in depth, but it is aimed at the
            neighbouring Bangande, not at links further south.<Cite id="bangande" /> We found no study comparing Ijaw genomes with Dogon or Kru ones at all.
          </P>
          <P>
            The cautious reading is that, on small samples, Ijaw people look genetically much like
            their neighbours, even though their language does not. This is common, since genes and
            languages can travel separately. Centuries of intermarriage could produce that result,
            but so could shared deep ancestry, and the current data cannot separate the two. They
            certainly do not show that the Ijaw are a genetic relic, and they do not rule out
            anything about where the language came from.
          </P>
        </>
      ),
    },
    {
      heading: 'The most likely origin story',
      status: { label: 'Our best reconstruction, not settled fact', tone: 'mixed' },
      body: (
        <>
          <P>Putting all of this together, here is the sequence we think fits the evidence best.</P>
          <Ol>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">A very old split.</strong>{' '}
              Ijoid’s ancestor separated from other West African language lines very long ago, if it
              was ever part of them. Kay Williamson’s often-quoted figure is about 7,000 years from
              Yoruba and Igbo.<Cite id="derefaka" /> Treat that as an order of magnitude, since
              dating by word comparison is rough. It also dates a language split, not arrival in the
              Delta.
            </Li>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">
                A long time somewhere else, probably on a river.
              </strong>{' '}
              Blench points out a telling contrast: the Ijo languages are extremely close to one
              another yet very remote from everything else. That suggests speakers who lived
              elsewhere for a long time and reached the Delta quite recently. He proposes mobile
              fishers from the Upper Niger, somewhat like today’s Sorko, and notes a word for
              manatee shared by proto-Ijo and Bamana, far upriver in Mali.<Cite id="blench-geo" />{' '}
              This is the shakiest step, resting on an analogy and a single word, but it explains
              the contrast better than the alternatives.
            </Li>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">
                An earlier wave, mostly lost.
              </strong>{' '}
              Blench takes Defaka as the survivor of an earlier group of migrants, whose other
              languages were absorbed.<Cite id="blench-geo" /> Bruce Connell has asked whether
              Defaka might instead be an isolate that picked up Ijo-like features through
              contact.<Cite id="connell" /> A 2012 paper from his team supports a close link, but
              Good still calls that case less clear than the unity of Ijo itself.<Cite id="good" />
            </Li>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">
                Spreading out through the Delta.
              </strong>{' '}
              Oral traditions gathered by Alagoa point to a central Delta dispersal around
              Wilberforce Island, while Robin Horton argued for the east.<Cite id="ariye" /> The
              archaeologist Abi Derefaka argues the first settlement was probably multi-directional,
              by related peoples who already knew how to live off the water.<Cite id="derefaka" />{' '}
              We cannot yet say when this happened.
            </Li>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">
                Living with neighbours.
              </strong>{' '}
              Farming communities speaking Central Delta languages ended up surrounded by Ijo
              speakers, which suggests fishers and farmers coexisted.<Cite id="blench-geo" /> That
              long contact could explain why Ijaw people look so like their neighbours genetically
              while keeping a very different language, though this is our inference.
            </Li>
            <Li>
              <strong className="font-medium text-gray-900 dark:text-white">
                The Atlantic layer.
              </strong>{' '}
              The Portuguese were trading in the Delta by about 1500, and the Kru came in the 1800s.
              These are later chapters, not the origin.
            </Li>
          </Ol>
          <P>
            The main alternative is that Ijaw took shape in the Delta itself and has been there for
            something like the whole 7,000 years, a view found in some Ijo histories.<Cite id="ariye" />{' '}
            It deserves respect, and some communities such as the Ogulagha and Iduwini have no
            tradition of coming from anywhere else.<Cite id="izon" /> Its difficulty is the
            linguistic one: languages that had spread out in place for that long should have grown
            much further apart.
          </P>
          <P>
            In short, Ijaw is probably a very old and separate line in West African language
            history, carried into the Delta by people already at home on the water, and shaped by
            its neighbours ever since. The Kru were later companions, the coastal puzzles are
            parallels rather than relatives, and Dogon is at most a very distant cousin.
          </P>
          <P>
            Three things could change this picture: genome studies built around Ijaw communities,
            a careful word-by-word comparison of Ijoid with Kru and Dogon, and archaeology along
            the Lower Niger.
          </P>
        </>
      ),
    },
  ],
}

export default function IjawOrigins() {
  return <BlogPost post={POST} />
}
