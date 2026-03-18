// @ts-nocheck
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from '../app/generated/prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("開始執行 Seed... 🌱")
    const datasets = [
    { id: '00000000-0000-0000-0000-000000000000', name: 'News.csv' },
    { id: '00000000-0000-0000-0000-000000000001', name: 'spam.csv' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'IMDB.csv' },
  ]

  const previewData = [
    [
        { "input": `I am sure some bashers of Pens fans are pretty confused about the lack of any kind of posts about the recent Pens massacre of the Devils. Actually, I am  bit puzzled too and a bit relieved. However, I am going to put an end to non-PIttsburghers' relief with a bit of praise for the Pens. Man, they are killing those Devils worse than I thought. Jagr just showed you why he is much better than his regular season stats. He is also a lot fo fun to watch in the playoffs. Bowman should let JAgr have a lot of fun in the next couple of games since the Pens are going to beat the pulp out of Jersey anyway. I was very disappointed not to see the Islanders lose the final regular season game. PENS RULE!!! `, "output": "rec.sport.hockey" },
        {
            "input": `My brother is in the market for a high-performance video card that supports
          VESA local bus with 1-2MB RAM. Does anyone have suggestions/ideas on:
          
            - Diamond Stealth Pro Local Bus
            - Orchid Farenheit 1280
            - ATI Graphics Ultra Pro
            - Any other high-performance VLB card
          
          Please post or email. Thank you!
          
            - Matt`,
            "output": "comp.sys.ibm.pc.hardware"
          },
          {
            "input": `Finally you said what you dream about. Mediterranean???? That was new....
          The area will be ""greater"" after some years, like your ""holocaust"" numbers......
          
          *****
          Is't July in USA now????? Here in Sweden it's April and still cold.
          Or have you changed your calendar???
          
                      ******************
                      ******************
                ***************
          
          NOTHING OF THE MENTIONED IS TRUE, BUT LET SAY IT's TRUE.
          
          SHALL THE AZERI WOMEN AND CHILDREN GOING TO PAY THE PRICE WITH
                      **************
          BEING RAPED, KILLED AND TORTURED BY THE ARMENIANS??????????
          
          HAVE YOU HEARDED SOMETHING CALLED: ""GENEVA CONVENTION""???????
          YOU FACIST!!!!!
          
          Ohhh i forgot, this is how Armenians fight, nobody has forgot
          you killings, rapings and torture against the Kurds and Turks once
          upon a time!
          
          Ohhhh so swedish RedCross workers do lie they too? What ever you say
          ""regional killer"", if you don't like the person then shoot him that's your policy.....l
          
                              i
                              i
                              i
          Confused?????       i
                              i
          Search Turkish planes? You don't know what you are talking about.   i
          Turkey's government has announced that it's giving weapons  <-----------i
          to Azerbadjan since Armenia started to attack Azerbadjan        
          it self, not the Karabag province. So why search a plane for weapons    
          since it's content is announced to be weapons?   
          
          If there is one that's confused then that's you! We have the right (and we do)
          to give weapons to the Azeris, since Armenians started the fight in Azerbadjan!
          
          Shoot down with what? Armenian bread and butter? Or the arms and personel 
          of the Russian army?`,
            "output": "talk.politics.mideast"
          },
          {
            "input": `Think!
          
          It's the SCSI card doing the DMA transfers NOT the disks...
          
          The SCSI card can do DMA transfers containing data from any of the SCSI devices
          it is attached when it wants to.
          
          An important feature of SCSI is the ability to detach a device. This frees the
          SCSI bus for other devices. This is typically used in a multi-tasking OS to
          start transfers on several devices. While each device is seeking the data the
          bus is free for other commands and data transfers. When the devices are
          ready to transfer the data they can aquire the bus and send the data.
          
          On an IDE bus when you start a transfer the bus is busy until the disk has seeked
          the data and transfered it. This is typically a 10-20ms second lock out for other
          processes wanting the bus irrespective of transfer time.`,
            "output": "comp.sys.ibm.pc.hardware"
          },
          {
            "input": `Back in high school I worked as a lab assistant for a bunch of experimental
          psychologists at Bell Labs. When they were doing visual perception and
          memory experiments, they used vector-type displays, with 1-millisecond
          refresh rates common.
          
          So your case of 1/200th sec is quite practical, and the experimenters were
          probably sure that it was 5 milliseconds, not 4 or 6 either.
          
          Steve`,
            "output": "sci.electronics"
          }
      ],
      [
        { "input":`Go until jurong point, crazy.. Available only in bugis n great world la e buffet... Cine there got amore wat...
        ` , "output": "0"},
        { "input":`Ok lar... Joking wif u oni...` , "output": "0"},
        { "input": `Free entry in 2 a wkly comp to win FA Cup final tkts 21st May 2005. Text FA to 87121 to receive entry question(std txt rate)T&C's apply 08452810075over18's`, "output":"1"},
        { "input": `U dun say so early hor... U c already then say...`, "output":"0"},
        { "input": `Nah I don't think he goes to usf, he lives around here though`, "output":"0"},
      ],
       [
        { "input": `I really liked this Summerslam due to the look of the arena, the curtains and just the look overall was interesting to me for some reason. Anyways, this could have been one of the best Summerslam's ever if the WWF didn't have Lex Luger in the main event against Yokozuna, now for it's time it was ok to have a huge fat man vs a strong man but I'm glad times have changed. It was a terrible main event just like every match Luger is in is terrible. Other matches on the card were Razor Ramon vs Ted Dibiase, Steiner Brothers vs Heavenly Bodies, Shawn Michaels vs Curt Hening, this was the event where Shawn named his big monster of a body guard Diesel, IRS vs 1-2-3 Kid, Bret Hart first takes on Doink then takes on Jerry Lawler and stuff with the Harts and Lawler was always very interesting, then Ludvig Borga destroyed Marty Jannetty, Undertaker took on Giant Gonzalez in another terrible match, The Smoking Gunns and Tatanka took on Bam Bam Bigelow and the Headshrinkers, and Yokozuna defended the world title against Lex Luger this match was boring and it has a terrible ending. However it deserves 8/10
        `, "output":"positive"},
        { "input": `Not many television shows appeal to quite as many different kinds of fans like Farscape does...I know youngsters and 30/40+ years old;fans both Male and Female in as many different countries as you can think of that just adore this T.V miniseries. It has elements that can be found in almost every other show on T.V, character driven drama that could be from an Australian soap opera; yet in the same episode it has science fact & fiction that would give even the hardiest "Trekkie" a run for his money in the brainbender stakes! Wormhole theory, Time Travel in true equational form...Magnificent. It embraces cultures from all over the map as the possibilities are endless having multiple stars and therefore thousands of planets to choose from.<br /><br />With such a broad scope; it would be expected that nothing would be able to keep up the illusion for long, but here is where "Farscape" really comes into it's own element...It succeeds where all others have failed, especially the likes of Star Trek (a universe with practically zero Kaos element!) They ran out of ideas pretty quickly + kept rehashing them! Over the course of 4 seasons they manage to keep the audience's attention using good continuity and constant character evolution with multiple threads to every episode with unique personal touches to camera that are specific to certain character groups within the whole. This structure allows for an extremely large area of subject matter as loyalties are forged and broken in many ways on many many issues. I happened to see the pilot (Premiere) in passing and just had to keep tuning in after that to see if Crichton would ever "Get the girl", after seeing them all on television I was delighted to see them available on DVD & I have to admit that it was the only thing that kept me sane whilst I had to do a 12 hour night shift and developed chronic insomnia...Farscape was the only thing to get me through those extremely long nights...<br /><br />Do yourself a favour; Watch the pilot and see what I mean...<br /><br />Farscape Comet
        `, "output":"positive"},
        { "input": `The film quickly gets to a major chase scene with ever increasing destruction. The first really bad thing is the guy hijacking Steven Seagal would have been beaten to pulp by Seagal's driving, but that probably would have ended the whole premise for the movie.<br /><br />It seems like they decided to make all kinds of changes in the movie plot, so just plan to enjoy the action, and do not expect a coherent plot. Turn any sense of logic you may have, it will reduce your chance of getting a headache.<br /><br />I does give me some hope that Steven Seagal is trying to move back towards the type of characters he portrayed in his more popular movies.
        `, "output":"negative"},
        { "input": `Jane Austen would definitely approve of this one!<br /><br />Gwyneth Paltrow does an awesome job capturing the attitude of Emma. She is funny without being excessively silly, yet elegant. She puts on a very convincing British accent (not being British myself, maybe I'm not the best judge, but she fooled me...she was also excellent in "Sliding Doors"...I sometimes forget she's American ~!). <br /><br />Also brilliant are Jeremy Northam and Sophie Thompson and Phyllida Law (Emma Thompson's sister and mother) as the Bates women. They nearly steal the show...and Ms. Law doesn't even have any lines!<br /><br />Highly recommended.
        `, "output":"positive"},
        { "input": `Expectations were somewhat high for me when I went to see this movie, after all I thought Steve Carell could do no wrong coming off of great movies like Anchorman, The 40 Year-Old Virgin, and Little Miss Sunshine. Boy, was I wrong.<br /><br />I'll start with what is right with this movie: at certain points Steve Carell is allowed to be Steve Carell. There are a handful of moments in the film that made me laugh, and it's due almost entirely to him being given the wiggle-room to do his thing. He's an undoubtedly talented individual, and it's a shame that he signed on to what turned out to be, in my opinion, a total train-wreck.<br /><br />With that out of the way, I'll discuss what went horrifyingly wrong.<br /><br />The film begins with Dan Burns, a widower with three girls who is being considered for a nationally syndicated advice column. He prepares his girls for a family reunion, where his extended relatives gather for some time with each other.<br /><br />The family is high atop the list of things that make this an awful movie. No family behaves like this. It's almost as if they've been transported from Pleasantville or Leave it to Beaver. They are a caricature of what we think a family is when we're 7. It reaches the point where they become obnoxious and simply frustrating. Touch football, crossword puzzle competitions, family bowling, and talent shows ARE NOT HOW ACTUAL PEOPLE BEHAVE. It's almost sickening.<br /><br />Another big flaw is the woman Carell is supposed to be falling for. Observing her in her first scene with Steve Carell is like watching a stroke victim trying to be rehabilitated. What I imagine is supposed to be unique and original in this woman comes off as mildly retarded.<br /><br />It makes me think that this movie is taking place on another planet. I left the theater wondering what I just saw. After thinking further, I don't think it was much.
        `, "output":"negative"},
      ]
  ]

  for (let i = 0; i < datasets.length; i++) {
    const ds = datasets[i];
    const data = previewData[i]; 

   await prisma.dataset.upsert({
      where: { datasetId: ds.id },
      update: {
        preview: data,
        isDefault: true 
      },
      create: {
        datasetId: ds.id,
        userId: null,   
        csvName: ds.name,
        sessionId: null,
        preview: data,
        isDefault: true 
      },
    });
}}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
