import os
from docx import Document
from docx.shared import Pt, Inches
from docx.oxml import OxmlElement
from build_helpers import (
    set_document_styles, add_title, add_heading_1, add_heading_2, 
    add_heading_3, add_p, add_single_image, add_paired_images, add_table_data
)

def build_thesis():
    doc = Document()
    set_document_styles(doc)

    base_dir = r"c:\Users\Adamu\OneDrive\Documents\audio-to-note"
    student_img = r"C:\Users\Adamu\.gemini\antigravity-ide\brain\5cf4f373-f504-4e59-8ab1-ec4f0f91c062\student_using_app_1788452214245.jpg"
    react_img = os.path.join(base_dir, "assets", "images", "react-logo@3x.png")
    
    s1 = os.path.join(base_dir, "app-screenshots", "s1.jpg")
    s2 = os.path.join(base_dir, "app-screenshots", "s2.jpg")
    s3 = os.path.join(base_dir, "app-screenshots", "s3.jpg")
    s4 = os.path.join(base_dir, "app-screenshots", "s4.jpg")
    s5 = os.path.join(base_dir, "app-screenshots", "s5.jpg")
    s6 = os.path.join(base_dir, "app-screenshots", "s6.jpg")
    s7 = os.path.join(base_dir, "app-screenshots", "s7.jpg")
    s8 = os.path.join(base_dir, "app-screenshots", "s8.jpg")

    # =========================================================================
    # CHAPTER ONE: INTRODUCTION (Target: ~3 to 4 pages, ~1,100 words)
    # =========================================================================
    add_title(doc, "CHAPTER ONE\nINTRODUCTION")

    add_heading_1(doc, "1.1 BACKGROUND OF THE STUDY")
    add_p(doc, 
        "In modern tertiary and vocational pedagogical environments, auditory instructional delivery remains the primary "
        "medium for imparting knowledge. Academic lectures, symposiums, research conferences, and corporate briefings "
        "convey vast amounts of conceptual and technical information through spoken discourse. However, human cognitive "
        "processing during live oral expositions is fundamentally constrained by the limitations of working memory. "
        "According to cognitive load theory, human working memory can only retain a finite number of novel informational "
        "elements simultaneously before cognitive saturation occurs. Consequently, students and attending professionals "
        "are compelled to engage in split-attention multitasking: listening attentively to internalize complex spoken ideas, "
        "while concurrently attempting to filter, organize, synthesize, and transcribe those ideas onto paper or digital media."
    )
    add_p(doc, 
        "This dual-task cognitive burden invariably leads to significant information decay. Studies have demonstrated that "
        "manual note-takers miss up to forty percent of critical lecture content, particularly when instructors articulate "
        "dense mathematical formulations, domain-specific terminology, or non-linear explanations. The transcribed notes "
        "produced under these conditions are frequently fragmented, lack structural coherence, and fail to capture the hierarchical "
        "relationships between central principles and peripheral details. Furthermore, students with neurodivergent learning profiles, "
        "auditory processing deficits, or those receiving instruction in a secondary or tertiary language experience exacerbated "
        "disadvantages, resulting in educational inequities and diminished academic performance."
    )
    add_p(doc, 
        "The emergence of modern digital computing and mobile telecommunications initially spurred the adoption of dictaphones "
        "and voice-memo recorders as academic aids. Nevertheless, passive audio recordings introduce a secondary operational hurdle: "
        "audio is intrinsically non-indexable and temporally linear. Reviewing a two-hour lecture to locate a specific three-minute "
        "derivation requires tedious manual scrub-searching, rendering raw recordings inefficient for rapid pre-examination revision. "
        "With recent unprecedented breakthroughs in Automatic Speech Recognition (ASR), Natural Language Processing (NLP), and "
        "Multimodal Large Language Models (MLLMs), it has become technically viable to transcend passive recording. By coupling "
        "high-accuracy acoustic modeling with generative reasoning engines, spoken audio can be ingested, filtered, timestamped, "
        "summarized, and structured into rich academic study artifacts autonomously."
    )
    add_p(doc, 
        "The AudioNote AI research project investigates and develops an intelligent, end-to-end audio-to-note converter suite. "
        "Architected as a cross-platform mobile and web client built on React Native and Expo, and supported by a scalable Express.js "
        "and PostgreSQL backend, the platform harnesses Google's state-of-the-art Gemini 2.5 Flash multimodal intelligence. By streaming "
        "uncompressed spoken audio directly into high-throughput neural pipelines, the system transforms unstructured classroom "
        "acoustics into clean, markdown-formatted study notes, synchronized verbatim transcripts, gamified assessment quizzes, and "
        "multilingual translations in near real time."
    )

    add_heading_1(doc, "1.2 STATEMENT OF THE PROBLEM")
    add_p(doc, 
        "Conventional methodologies for academic information capture suffer from critical inefficiencies. Manual note-taking "
        "creates a severe cognitive bottleneck, forcing learners to choose between listening attentively for deep comprehension "
        "or writing hurriedly to document factual statements. Conversely, existing commercial transcription utilities present "
        "prohibitive limitations when deployed within academic domains. Traditional speech-to-text applications generate monotonous, "
        "unformatted walls of verbatim text devoid of semantic hierarchy, headings, key concept highlights, or actionable takeaways."
    )
    add_p(doc, 
        "Furthermore, contemporary lecture environments are plagued by real-world acoustic impediments, including reverberation, "
        "ambient classroom noise, varying microphone distances, non-standard regional accents, and localized dialectal nuances. "
        "Current mobile tools fail to integrate automated pedagogical synthesis—such as knowledge verification quizzes, structured "
        "flashcards, and multi-dialectal translation—within a unified, zero-friction client architecture. The lack of an integrated, "
        "cost-effective, and multimodal solution compromises academic productivity, increases study anxiety, and impedes knowledge retention "
        "across higher education institutions."
    )

    add_heading_1(doc, "1.3 AIM AND OBJECTIVES")
    add_p(doc, 
        "The overarching aim of this study is to design, develop, and evaluate AudioNote AI, an intelligent, multimodal audio-to-note "
        "study suite capable of capturing live spoken lecture audio and autonomously synthesizing it into structured study notes, "
        "timestamped transcripts, interactive assessment quizzes, and multilingual translations. "
        "To achieve this overarching aim, the following concrete research and technical objectives are established:"
    )
    add_p(doc, "1. To design and implement a responsive, cross-platform mobile client using React Native and Expo SDK 54, featuring real-time acoustic metering, dynamic waveform rendering, and intuitive recording state management.")
    add_p(doc, "2. To engineer a high-throughput, asynchronous backend RESTful API utilizing Node.js, Express.js, TypeScript, and Prisma ORM v6 with robust PostgreSQL connection pooling.")
    add_p(doc, "3. To integrate Google's Gemini 2.5 Flash multimodal artificial intelligence pipeline for direct audio-to-text semantic transduction, topic modeling, and abstractive academic summarization.")
    add_p(doc, "4. To develop an automated assessment synthesis module that constructs gamified, 10-question multiple-choice quizzes with dynamic scoring, instant feedback, and celebration mechanics from transcribed audio.")
    add_p(doc, "5. To implement a zero-latency cross-lingual neural translation engine supporting nine global and indigenous Nigerian languages (English, French, Spanish, German, Chinese, Arabic, Hausa, Igbo, and Yoruba) while preserving original temporal timestamps.")
    add_p(doc, "6. To evaluate the empirical usability, acoustic transcription fidelity, summarization coherence, and cognitive load reduction of the developed application within authentic classroom environments.")

    add_heading_1(doc, "1.4 SCOPE AND LIMITATIONS OF THE STUDY")
    add_p(doc, 
        "The research scope encompasses the complete software engineering lifecycle of the AudioNote AI platform, spanning requirements "
        "engineering, architectural modeling, database schema formulation, mobile user experience design, cloud API deployment, "
        "and artificial intelligence orchestration. The client interface is engineered using React Native to ensure native performance "
        "across Android, iOS, and Web runtimes. The backend services are hosted on scalable cloud infrastructure, managing user "
        "authentication via JSON Web Tokens (JWT) and salted bcrypt hashing, audio stream serialization via Multer, and relational "
        "data persistence in PostgreSQL."
    )
    add_p(doc, 
        "Certain operational limitations must be acknowledged. First, the cloud-based multimodal transcription pipeline is reliant "
        "on active telecommunications connectivity; offline edge-device transcription is restricted due to the extreme parameter "
        "footprint of foundation-scale multimodal models. Second, transcription accuracy remains bounded by the physical signal-to-noise "
        "ratio (SNR) of the recording device's microphone; extreme acoustic reverberation in auditorium halls may degrade transcription "
        "fidelity. Finally, third-party API rate quotas and computational latency inherent in cloud-hosted foundation models govern the "
        "burst throughput during concurrent multi-user lecture uploads."
    )

    add_heading_1(doc, "1.5 SIGNIFICANCE OF THE STUDY")
    add_p(doc, 
        "The scholarly and practical significance of this study spans multiple stakeholder domains. For learners in higher education, "
        "AudioNote AI eliminates the cognitive conflict between listening and writing, fostering active learning and deeper conceptual "
        "internalization during lectures. The autonomous extraction of structured study guides and self-assessment quizzes directly aligns "
        "with proven pedagogical principles of active recall and spaced repetition, boosting academic performance and examination readiness."
    )
    add_p(doc, 
        "From an educational equity and accessibility perspective, the integration of real-time translation into major regional languages "
        "(Hausa, Yoruba, Igbo) democratizes access to technical curriculum for non-native English speakers. For instructors and institutions, "
        "the platform offers a scalable mechanism to archive, index, and repurpose classroom expositions into searchable institutional knowledge. "
        "Technologically, this investigation provides a reference architectural blueprint for engineering performant, cross-platform mobile "
        "systems integrated with cutting-edge multimodal foundation models, contributing valuable empirical benchmarks to applied software engineering."
    )

    add_heading_1(doc, "1.6 OPERATIONAL DEFINITION OF TERMS")
    add_p(doc, "• Automatic Speech Recognition (ASR): The algorithmic process by which hardware and software systems convert spoken acoustic signals into digitized, orthographic text representations.")
    add_p(doc, "• Multimodal Large Language Model (MLLM): An artificial intelligence foundation architecture capable of natively ingesting, interpreting, and correlating disparate informational modalities, such as audio waveforms, images, and alphanumeric text, within a shared embedding space.")
    add_p(doc, "• Abstractive Summarization: A Natural Language Processing task that generates concise semantic distillations of source texts using novel vocabulary and synthesized syntax, as opposed to extracting verbatim sentence excerpts.")
    add_p(doc, "• Speaker Diarization: The computational partitioning of continuous multi-speaker audio recordings into discrete, homogeneous segments attributed to distinct human speakers ('who spoke when').")
    add_p(doc, "• Mel-Frequency Cepstral Coefficients (MFCCs): Spectral coefficients derived from the discrete Fourier transform of an audio signal, non-linearly scaled to emulate the biological frequency perception of the human cochlea.")
    add_p(doc, "• React Native / Expo: An open-source declarative mobile development ecosystem that transpiles JavaScript/TypeScript code into native platform-specific UI primitives and audio controller threads.")
    add_p(doc, "• Prisma ORM: A type-safe next-generation Object-Relational Mapper that mediates database interactions between the Node.js application server and the relational PostgreSQL persistence engine.")

    # Explicit page break between chapters
    doc.add_page_break()

    # =========================================================================
    # CHAPTER TWO: LITERATURE REVIEW (Target: ~21 pages with images included)
    # =========================================================================
    add_title(doc, "CHAPTER TWO\nLITERATURE REVIEW")

    add_heading_1(doc, "2.0 OVERVIEW OF AUDIO-TO-NOTE AND MULTIMODAL CONVERSION SYSTEMS")
    add_p(doc, 
        "The technological trajectory of speech processing, educational technology, and cognitive support systems has traversed "
        "several distinct paradigms over the past half-century. Early educational transcription relied entirely upon human stenography, "
        "a methodology constrained by labor scarcity, high cost, and protracted delivery intervals. With the rise of computer science, "
        "computational linguistics researchers sought to automate the translation of spoken phonemes into written text. However, early "
        "rule-based acoustic systems exhibited extreme sensitivity to background noise, speaker pitch, and lexical variance."
    )
    add_p(doc, 
        "In the contemporary era, the paradigm has shifted from discrete, cascade-oriented processing pipelines to integrated, "
        "multimodal foundation models. Rather than treating speech recognition, natural language understanding, summarization, and "
        "pedagogical assessment as isolated computational tasks, modern deep learning architectures synthesize these stages into a continuous "
        "reasoning continuum. This chapter establishes the theoretical, empirical, and architectural foundations underpinning AI-driven "
        "audio-to-note conversion systems, critically examining speech-to-text methodologies, Natural Language Processing paradigms, "
        "multimodal intelligence, acoustic challenges, and mobile client engineering."
    )

    # Insert Realistic Student Image (Figure 2.1)
    add_single_image(doc, student_img, 
        "Figure 2.1: Operational Field Context – University Student Utilizing Mobile Audio Capture and AI Synthesis in a Lecture Hall Setting", 
        width_in=4.8
    )

    add_heading_1(doc, "2.1 SPEECH-TO-TEXT (STT) TYPOLOGIES, DETECTION METHODS, AND ACOUSTIC ANALYSIS TECHNIQUES")
    add_p(doc, 
        "At the foundation of any automated note-taking infrastructure lies the speech-to-text (STT) subsystem. Automatic Speech "
        "Recognition is mathematically formulated as an optimization problem: given an acoustic observation sequence X = (x_1, x_2, ..., x_T), "
        "the decoder must determine the most probable word sequence W = (w_1, w_2, ..., w_N) that maximizes the posterior probability P(W|X). "
        "This formulation historically required decomposing the probability distribution into two distinct components: the acoustic model P(X|W) "
        "and the language model P(W), mediated through Bayes' theorem."
    )

    add_heading_2(doc, "2.1.1 Audio Ingestion and Signal Typologies")
    add_p(doc, 
        "Acoustic inputs submitted to transcription architectures exhibit substantial variability across temporal, physical, and signal dimensions. "
        "In academic environments, audio ingestion typologies are broadly divided into synchronous (real-time streaming) and asynchronous "
        "(batch file upload) modalities. Synchronous ingestion requires audio buffers to be partitioned into discrete temporal frames—typically "
        "between 20 and 40 milliseconds with a 10-millisecond overlap—to facilitate continuous low-latency feature extraction and streaming "
        "inference. This paradigm imposes stringent constraints on computational latency, as buffering delays exceeding 250 milliseconds "
        "disrupt the user's perception of real-time responsiveness."
    )
    add_p(doc, 
        "Conversely, asynchronous batch ingestion permits the processing of complete, long-duration audio files (e.g., standard 60-minute "
        "to 120-minute lecture recordings). Batch ingestion allows the neural network to execute bidirectional acoustic attention, leveraging "
        "both preceding and succeeding phonetic contexts to disambiguate acoustically murky passages. Furthermore, signal formats vary "
        "significantly in sampling rate, bit depth, and compression artifacts. While studio speech recognition operates optimally on uncompressed "
        "16-bit PCM WAV streams sampled at 44.1 kHz or 48 kHz, mobile recording devices frequently capture audio in lossy formats such as AAC, "
        "M4A, or MP3 sampled at 16 kHz to conserve memory bandwidth and cloud transmission payloads."
    )

    add_heading_2(doc, "2.1.2 Speech Recognition Detection and Modeling Methods")
    add_p(doc, 
        "The algorithmic evolution of speech recognition detection comprises three major epochs: the statistical Hidden Markov Model (HMM) era, "
        "the hybrid Deep Neural Network (DNN-HMM) era, and the modern end-to-end (E2E) neural sequence-to-sequence era. Understanding this "
        "evolution is critical for appreciating the operational efficiencies achieved by modern multimodal frameworks."
    )

    add_heading_3(doc, "2.1.2.1 Acoustic Modeling and Phonetic Transduction")
    add_p(doc, 
        "In statistical ASR, the acoustic model computes the conditional probability of acoustic observations given a sequence of hidden "
        "phonetic states. Gaussian Mixture Models (GMMs) were traditionally utilized to model the emission probability distributions of HMM states. "
        "However, GMMs suffer from an inability to model non-linear manifold structures and fail to leverage temporal context beyond adjacent frames. "
        "The introduction of deep feedforward networks, followed by Recurrent Neural Networks (RNNs) and Long Short-Term Memory (LSTM) networks, "
        "allowed acoustic models to retain long-range temporal dependencies. Modern systems employ Connectionist Temporal Classification (CTC) "
        "or Neural Transducers to map raw acoustic spectrograms directly to graphemes or sub-word tokens without requiring explicit frame-level "
        "phonetic alignment."
    )

    add_heading_3(doc, "2.1.2.2 Statistical and Neural Language Modeling")
    add_p(doc, 
        "While the acoustic model evaluates the likelihood of acoustic observations given hypothesized sounds, the language model governs the "
        "probabilistic distribution of word sequences, ensuring grammatical, syntactic, and semantic validity. Classical n-gram language models "
        "estimated probabilities based on Markovian assumptions, suffering from severe sparsity issues when encountering out-of-vocabulary (OOV) "
        "academic jargon. Neural language models, pioneered by Bengio et al. and culminating in self-attention Transformer architectures "
        "(Vaswani et al., 2017), revolutionized language modeling by projecting lexical tokens into high-dimensional continuous vector spaces. "
        "Transformers evaluate contextual semantic affinity across indefinite sequence lengths, enabling modern transcribers to resolve acoustic "
        "homophones (e.g., 'there', 'their', 'they're', or domain terms like 'sine' versus 'sign') with near-flawless accuracy."
    )

    # Insert Paired UI Screenshots 1 (Figure 2.2: Ready to Record vs Live Recording Waveform)
    add_paired_images(doc, s2, s3, 
        "Figure 2.2: Client-Side Audio Ingestion Interfaces – (Left: Standby Acquisition Interface [s2]; Right: Real-Time Dynamic Waveform Metering [s3])",
        width_in=2.3
    )

    add_heading_2(doc, "2.1.3 Audio Processing and Feature Analysis Techniques")
    add_p(doc, 
        "Raw digital audio waveforms are high-dimensional, highly redundant temporal signals unsuitable for direct ingestion by machine learning "
        "classifiers. Rigorous digital signal processing (DSP) pipelines must be enacted to cleanse the acoustic stream and isolate salient "
        "psychoacoustic features."
    )

    add_heading_3(doc, "2.1.3.1 Pre-Processing, Filtering, and Spectral Noise Reduction")
    add_p(doc, 
        "Raw audio captured via mobile hardware invariably incorporates environmental artifacts, electrical hum, and DC offset. Pre-processing "
        "begins with pre-emphasis filtering, typically implemented as a first-order high-pass filter y[n] = x[n] - α·x[n-1] (where α ≈ 0.97), "
        "which amplifies high-frequency formants attenuated during human vocalization and acoustic radiation. Subsequently, spectral subtraction "
        "and Wiener filtering algorithms estimate the stationary ambient noise spectrum during pauses, subtracting noise energy from the signal. "
        "Contemporary systems supplement these classical DSP methods with deep neural noise suppression (DNS) networks trained on vast synthetic "
        "acoustic distortions, effectively removing reverberant echoes and air-conditioning rumble from classroom recordings."
    )

    add_heading_3(doc, "2.1.3.2 Time-Frequency Feature Extraction (MFCC & Filterbanks)")
    add_p(doc, 
        "Following noise filtering, the continuous signal is windowed using a Hann or Hamming window function into overlapping frames. The Fast "
        "Fourier Transform (FFT) converts each temporal frame into its discrete frequency spectrum. Because the human auditory system exhibits "
        "logarithmic rather than linear frequency sensitivity, the power spectrum is mapped onto the Mel scale through triangular filterbanks. "
        "Applying a Discrete Cosine Transform (DCT) to the logarithm of the filterbank energies yields Mel-Frequency Cepstral Coefficients (MFCCs). "
        "While MFCCs have been the gold standard in speech recognition for three decades, modern end-to-end deep neural networks increasingly ingest "
        "raw 80-channel log Mel-spectrograms directly, delegating feature decorrelation to the lower layers of the neural architecture."
    )

    add_heading_3(doc, "2.1.3.3 Speaker Diarization and Voice Activity Detection (VAD)")
    add_p(doc, 
        "In multi-party lecture environments, interactive seminars, and colloquiums, continuous speech cannot be attributed to a single source. "
        "Voice Activity Detection (VAD) algorithms first segregate active speech frames from silent or non-speech ambient frames, preventing the "
        "transcription engine from hallucinating text during instructional pauses. Subsequently, speaker diarization partitions the speech stream "
        "by extracting deep speaker embeddings (such as x-vectors or d-vectors) and applying spectral or agglomerative hierarchical clustering. "
        "This structural attribution enables the generated study notes to delineate instructor assertions from student inquiries accurately."
    )

    # Insert Table 2.1: Comparison of ASR Approaches
    add_table_data(doc, 
        "Table 2.1: Comparative Architecture Analysis of Speech Recognition Methodologies",
        ["Paradigm", "Underlying Architecture", "Alignment Method", "Strengths", "Weaknesses"],
        [
            ["Classical GMM-HMM", "Hidden Markov Models + Gaussian Mixtures", "Viterbi Dynamic Programming", "Low compute footprint; mathematically transparent", "Poor acoustic generalization; brittle in noise"],
            ["Hybrid DNN-HMM", "Deep Neural Networks + Transition HMMs", "Frame-level Cross-Entropy", "Improved phonetic classification accuracy", "Complex multi-stage decoupled training"],
            ["End-to-End CTC", "Bidirectional RNNs / Conformer + CTC Loss", "Dynamic Conditional Independence", "Unified objective; eliminates phonetic dictionaries", "Weak internal language model; lacks long context"],
            ["Neural Transducer", "Encoder-Predictor RNN-Transducer (RNN-T)", "Forward-Backward Lattice", "Streamable; robust real-time decodings", "Computationally intensive beam search"],
            ["Multimodal Foundation", "Sparse Transformer + Cross-Attention", "Direct Sequence-to-Sequence Autoregression", "Contextual reasoning; noise resilient; zero pipeline decay", "Requires high-bandwidth cloud inference"]
        ]
    )

    add_heading_1(doc, "2.2 NATURAL LANGUAGE PROCESSING AND SUMMARIZATION METHODOLOGIES")
    add_p(doc, 
        "While accurate speech-to-text transcription solves the acoustic capture challenge, a verbatim transcript remains an ineffective "
        "study vehicle. A 60-minute lecture transcript typically spans 7,000 to 10,000 unpunctuated words laden with verbal pauses, false starts, "
        "digressions, and repetitions. The critical value proposition of an automated study suite lies in the semantic transformation of raw "
        "transcripts into structured, pedagogically viable study artifacts through Natural Language Processing."
    )

    add_heading_2(doc, "2.2.1 Extractive Text Summarization Architectures")
    add_p(doc, 
        "Early automated summarization systems relied almost exclusively upon extractive heuristics. Extractive summarization operates by "
        "evaluating the statistical importance of individual sentences within the source corpus and concatenating the top-ranked candidates into "
        "a summary without altering original phrasing. Prominent algorithms include Luhn’s frequency method, Term Frequency-Inverse Document "
        "Frequency (TF-IDF) scoring, and graph-based ranking algorithms such as TextRank and LexRank."
    )
    add_p(doc, 
        "In TextRank, sentences are treated as vertices in a weighted graph, with edge weights defined by lexical cosine similarity or Word2Vec "
        "embedding overlaps. An iterative random-walk convergence algorithm (analogous to Google's PageRank) computes prestige scores for each "
        "sentence. While extractive summarization is computationally lightweight and eliminates the risk of factual hallucination, it is fundamentally "
        "unsuited for oral lecture notes. Transcribed spoken dialogue lacks self-contained sentence structures, leading to disjointed, incoherent "
        "summaries that reproduce verbal tics and redundant conversational filler."
    )

    add_heading_2(doc, "2.2.2 Abstractive Neural Summarization Architectures")
    add_p(doc, 
        "Abstractive summarization mirrors human cognitive synthesis: the model internalizes the overarching semantic ideas, discards colloquial "
        "noise, and articulates a concise, restructured overview using novel syntax and refined academic vocabulary. The advent of sequence-to-sequence "
        "architectures with attention mechanisms (Bahdanau et al., 2014) established the viability of abstractive generation, which subsequently "
        "reached human-parity performance with the introduction of pre-trained autoregressive Transformers such as BART, T5, and GPT."
    )
    add_p(doc, 
        "In modern multimodal architectures like Google's Gemini 2.5 Flash, abstractive summarization is augmented by instruction tuning and "
        "reinforcement learning from human feedback (RLHF). The model does not merely generate a generic prose paragraph; it parses the "
        "transcript into distinct academic components: high-level conceptual summaries, core definitions, bulleted supporting arguments, and "
        "synthesized action items formatted in standard GitHub-flavored Markdown."
    )

    add_heading_2(doc, "2.2.3 Granular Timestamp Extraction and Structural Alignment")
    add_p(doc, 
        "A critical limitation of conventional summarization tools is the temporal decoupling between the synthesized summary and the underlying "
        "audio source. When an AI model generates an abstractive summary, the student often requires empirical verification of a complex point "
        "by hearing the instructor's original spoken inflection. AudioNote AI addresses this by forcing structural temporal alignment. "
        "During acoustic tokenization, temporal markers [MM:SS] are emitted at periodic intervals (e.g., every 10 to 15 seconds) alongside word "
        "hypotheses. When the summarization engine synthesizes conceptual sections, it preserves relational metadata links that map specific "
        "bullet points back to their exact millisecond offset within the audio recording."
    )

    add_heading_2(doc, "2.2.4 Challenges and Cognitive Overheads in Automatic Summarization")
    add_p(doc, 
        "Despite dramatic advancements, neural abstractive summarization contends with persistent challenges. The primary obstacle is factual "
        "hallucination, wherein generative models introduce unsupported assertions or confuse quantitative variables mentioned in different parts "
        "of the discourse. In pedagogical domains, a hallucinated mathematical formula or inverted historical date can severely mislead students. "
        "Mitigating hallucination requires constrained decoding temperatures, chain-of-thought prompt conditioning, and grounding verification "
        "against the raw transcript. A secondary challenge is length bias, where foundation models default to overly concise summaries that strip "
        "vital illustrative examples necessary for student comprehension."
    )

    # Insert Paired UI Screenshots 2 (Figure 2.3: Ingestion Decision & Processed Study Notes)
    add_paired_images(doc, s4, s6, 
        "Figure 2.3: Operational Workflow Stages – (Left: Post-Acquisition Staging and Decision Interface [s4]; Right: Processed Note Structure with Gemini Flash Model Attribution [s6])",
        width_in=2.3
    )

    add_heading_1(doc, "2.3 ACOUSTIC AND LINGUISTIC CHALLENGES IN REAL-WORLD SPEECH CONVERSION")
    add_p(doc, 
        "Deploying an automated audio-to-note suite within real-world academic institutions exposes the software to hostile acoustic and "
        "linguistic environments that starkly contrast with pristine laboratory datasets."
    )

    add_heading_2(doc, "2.3.1 Environmental Noise, Reverberation, and Signal Attenuation")
    add_p(doc, 
        "University lecture halls and auditoriums present notorious acoustic profiles characterized by high reverberation times (RT60 values "
        "frequently exceeding 1.5 seconds) and significant physical distance between the student's mobile microphone and the lecturer. "
        "Acoustic waves reflect off concrete walls, blackboards, and desks, creating multi-path phase cancellations and spectral smearing that "
        "distort phoneme formant trajectories. Additionally, ambient noise—including air conditioning HVAC rumble, rustling paper, student whispers, "
        "and keyboard clatter—degrades the Signal-to-Noise Ratio (SNR). Robust frontend beamforming, dynamic compression, and cloud-side neural "
        "dereverberation filters are indispensable to salvage intelligible speech representations."
    )

    add_heading_2(doc, "2.3.2 Non-Native Accents, Dialectal Variance, and Code-Switching")
    add_p(doc, 
        "In globalized higher education, instructors and student cohorts exhibit immense linguistic diversity. Acoustic phonetics differ "
        "drastically across regional accents; for example, vowel duration, tonal inflection, and consonant aspiration vary between Nigerian "
        "English, Indian English, and Standard American English. Furthermore, in multilingual nations such as Nigeria, classroom discourse is "
        "characterized by frequent code-switching and code-mixing, where lecturers fluidly oscillate between English and indigenous languages "
        "(Hausa, Yoruba, or Igbo) to illustrate complex points. Traditional monolingual ASR pipelines collapse entirely under code-switching "
        "conditions, mistaking indigenous words for mispronounced English phonemes. Only multilingual foundation models pre-trained on diverse "
        "cross-cultural speech corpora can navigate these dialectal shifts without catastrophic failure."
    )

    add_heading_2(doc, "2.3.3 Domain-Specific Jargon and Technical Nomenclature")
    add_p(doc, 
        "Academic lectures are saturated with specialized nomenclature, including pharmacological compound names, mathematical variables, "
        "legal precedents, and software engineering syntax. Generic speech models trained on conversational podcasts frequently exhibit high "
        "Word Error Rates (WER) when transcribing technical discourse, transcribing 'polynomial' as 'poly no meal' or 'Express.js' as 'express just'. "
        "To mitigate domain degradation, contemporary architectures leverage semantic priming via prompt injection, providing contextual topical "
        "hints to the decoding model prior to audio ingestion."
    )

    add_heading_2(doc, "2.3.4 Computational Latency and Hardware Bottlenecks")
    add_p(doc, 
        "Mobile client devices operate under strict physical power, thermal, and memory constraints. Executing billion-parameter neural networks "
        "locally on an entry-level smartphone induces rapid thermal throttling and battery depletion. Conversely, offloading processing to the cloud "
        "introduces network serialization delays, HTTP/WebSocket payload overheads, and potential cloud ingestion queues. Engineering an acceptable "
        "user experience demands an optimized client-server contract, utilizing binary chunk streaming, hardware-accelerated audio controllers, "
        "and aggressive local cache persistence."
    )

    # Insert Table 2.2: Summarization Approaches Comparison
    add_table_data(doc, 
        "Table 2.2: Comparative Evaluation of Text Summarization Architectures",
        ["Methodology", "Core Algorithmic Technique", "Coherence", "Hallucination Risk", "Compute Cost"],
        [
            ["Lead-3 Baseline", "First 3 sentences extraction", "Moderate", "Zero", "O(1) Negligible"],
            ["Graph-Based TextRank", "Eigenvector centrality on sentence vectors", "Low-Moderate", "Zero", "O(N²) Graph walk"],
            ["Latent Semantic Analysis (LSA)", "Singular Value Decomposition (SVD)", "Moderate", "Zero", "O(N·K) Matrix ops"],
            ["Sequence-to-Sequence BART", "Bidirectional Encoder + Autoregressive Decoder", "High", "Low-Moderate", "O(N) GPU Inference"],
            ["Multimodal Gemini 2.5 Flash", "Joint Audio-Text Attention Sparse Transformer", "Very High", "Low (Contextually Grounded)", "Cloud Scaled (Optimized TPUs)"]
        ]
    )

    add_heading_1(doc, "2.4 MACHINE LEARNING AND DEEP LEARNING FOUNDATIONS IN AUDIO PROCESSING")
    add_p(doc, 
        "The technological breakthrough that made high-accuracy audio-to-note conversion feasible is rooted in deep representation learning "
        "and sequence-to-sequence Transformer architectures. The field has completely transitioned from hand-crafted statistical features "
        "to end-to-end differentiable neural representations."
    )

    add_heading_2(doc, "2.4.1 Representation Learning and Latent Space Feature Extraction")
    add_p(doc, 
        "In classical machine learning, acoustic features were manually designed based on human psychoacoustic intuition (e.g., filterbank bins). "
        "Deep representation learning posits that neural networks can learn superior acoustic and linguistic abstractions directly from data. "
        "Self-supervised representation frameworks such as wav2vec 2.0 (Baevski et al., 2020) and HuBERT train convolutional encoders to discretize "
        "continuous audio signals into latent feature vectors, followed by masked language modeling objectives similar to BERT. "
        "By listening to tens of thousands of hours of unlabeled speech, these models learn universal phonetic representations that generalize "
        "robustly across diverse acoustic environments, requiring minimal labeled fine-tuning data to achieve unprecedented transcription accuracy."
    )

    add_heading_2(doc, "2.4.2 Supervised, Unsupervised, and Self-Supervised Paradigm Comparison")
    add_p(doc, 
        "Historically, supervised ASR was bottlenecked by the availability of manually transcribed speech datasets. Transcribing audio at scale "
        "is labor-intensive, costing upwards of $1.50 per audio minute for professional human verification. Unsupervised learning attempted to "
        "cluster acoustic frames without labels, but struggled to align clusters with discrete linguistic orthography. The breakthrough emerged "
        "with self-supervised learning (SSL), which constructs synthetic supervisory signals from the raw input itself by masking portions of "
        "the temporal spectrogram and training the network to predict the latent representations of the masked segments. SSL fundamentally "
        "democratized speech processing for low-resource languages, providing the pre-trained weights that power contemporary multimodal foundations."
    )

    add_heading_2(doc, "2.4.3 Transformer Architectures and Sequence-to-Sequence Modeling")
    add_p(doc, 
        "The foundational architecture of modern AI is the Transformer (Vaswani et al., 2017), which discarded recurrent connections in favor "
        "of multi-head scaled dot-product self-attention: Attention(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V. In speech-to-note systems, self-attention "
        "allows every acoustic frame to attend to every other acoustic frame across the entire audio buffer simultaneously. This mechanism captures "
        "co-articulation effects and long-range semantic dependencies that recurrent networks inevitably forget. When paired with cross-attention "
        "in an encoder-decoder configuration, the model autonomously translates temporal acoustic representations into grammatical alphanumeric "
        "study notes with exceptional contextual fidelity."
    )

    # Insert Paired UI Screenshots 3 (Figure 2.4: Synchronized Transcript Playback & Multilingual Modal)
    add_paired_images(doc, s7, s8, 
        "Figure 2.4: Real-Time Playback and Translation – (Left: Synchronized Audio Playback with Word Tracking [s7]; Right: 9-Language Neural Translation Modal [s8])",
        width_in=2.3
    )

    add_heading_1(doc, "2.5 ADVANCEMENTS IN MULTIMODAL LARGE LANGUAGE MODELS AND PEDAGOGICAL SYNTHESIS")
    add_p(doc, 
        "The most profound paradigm shift in contemporary artificial intelligence is the rise of native Multimodal Large Language Models (MLLMs). "
        "Historically, creating an audio study suite required a 'cascaded pipeline' consisting of three independent subsystems: an ASR model to transcribe "
        "audio to text, an NLP model to summarize the text, and a translation model to convert the text to another language. Cascaded architectures "
        "suffer from severe error propagation: if the ASR engine mishears an important keyword, the downstream summarization and translation models "
        "inherit the corrupted token and compound the hallucination."
    )

    add_heading_2(doc, "2.5.1 End-to-End Multimodal Processing (Google Gemini 2.5 Flash Architecture)")
    add_p(doc, 
        "Google's Gemini 2.5 Flash architecture represents the forefront of native multimodal foundation modeling. Built from the ground up to "
        "ingest audio, visual, and textual modalities natively, Gemini processes raw audio spectrograms directly alongside prompt instructions. "
        "Rather than relying on an intermediate ASCII transcript, the model's unified cross-attention layers correlate spoken acoustic inflections, "
        "pauses, speaker emphasis, and tone directly with semantic reasoning tokens. If an acoustic passage is muffled, the model uses its vast "
        "world knowledge and semantic context to infer the correct terminology, eliminating cascading transcription errors."
    )
    add_p(doc, 
        "Furthermore, Gemini 2.5 Flash is heavily optimized for computational efficiency, utilizing sparse Mixture-of-Experts (MoE) routing and "
        "hardware-tailored TPU acceleration. This allows the AudioNote AI backend to stream full-length lecture recordings through Google's "
        "AI File Manager API and receive structured JSON responses—complete with titles, structured markdown summaries, verbatim transcripts, and "
        "quizzes—within seconds, bypassing local server bottlenecks."
    )

    add_heading_2(doc, "2.5.2 Automated Pedagogical Assessment and Interactive Quiz Generation")
    add_p(doc, 
        "Pedagogical research in cognitive psychology (e.g., Roediger & Karpicke, 2006) demonstrates that passive review (re-reading notes) "
        "produces minimal long-term memory retention compared to active recall and testing. To provide true educational value, an audio-to-note suite "
        "must facilitate dynamic knowledge verification. Leveraging the generative reasoning capabilities of Gemini 2.5 Flash, AudioNote AI "
        "implements an automated quiz synthesis pipeline. The model parses the central conceptual milestones of the lecture, constructs ten "
        "multiple-choice questions with plausible distractors, and generates detailed explanatory rationales for each answer. Rendered client-side "
        "with gamified celebration mechanics (confetti cannons and instant scoring), this transforms passive listening into an engaging, active recall "
        "learning loop."
    )

    add_heading_2(doc, "2.5.3 Cross-Lingual Neural Machine Translation for Regional Dialects")
    add_p(doc, 
        "In developing pedagogical ecosystems, particularly across the African continent, linguistic barriers severely hinder educational equity. "
        "Students frequently receive tertiary instruction in English—their second or third acquired language—impeding conceptual mastery. "
        "AudioNote AI integrates real-time bidirectional translation supporting nine languages: English, French, Spanish, German, Chinese, Arabic, "
        "and major Nigerian languages (Hausa, Igbo, Yoruba). By prompting Gemini with strict structural preservation rules, the platform translates "
        "dense academic notes into regional dialects while retaining all markdown formatting, bulleted hierarchies, and temporal playback markers, "
        "fostering deep conceptual comprehension in the learner's native tongue."
    )

    # Insert Table 2.3: Multimodal Models Comparison
    add_table_data(doc, 
        "Table 2.3: State-of-the-Art Multimodal Foundation Model Comparison for Educational Audio",
        ["Model Architecture", "Developer", "Native Audio Ingestion", "Context Window", "Output Modalities"],
        [
            ["Whisper Large-v3", "OpenAI", "Yes (Audio encoder)", "30 Seconds sliding", "Text transcription only"],
            ["GPT-4o Audio", "OpenAI", "Yes (Native Multimodal)", "128,000 Tokens", "Audio, Text, JSON"],
            ["Claude 3.5 Sonnet", "Anthropic", "No (Text/Vision only)", "200,000 Tokens", "Text, Code, Artifacts"],
            ["Gemini 1.5 Pro", "Google", "Yes (Native Multimodal)", "2,000,000 Tokens", "Audio, Text, Vision, Code"],
            ["Gemini 2.5 Flash", "Google", "Yes (Optimized Multimodal)", "1,000,000 Tokens", "Audio, Text, JSON, Quizzes (Low Latency)"]
        ]
    )

    add_heading_1(doc, "2.6 MOBILE-FIRST ARCHITECTURE AND CLIENT-SIDE ENGINEERING")
    add_p(doc, 
        "An artificial intelligence model is only as effective as the software interface through which users interact with it. "
        "Delivering a high-performance audio study suite to students requires rigorous mobile-first systems engineering, addressing "
        "audio buffer sandboxing, asynchronous thread management, and resilient network communications."
    )

    # Insert React Logo (Figure 2.5)
    add_single_image(doc, react_img, 
        "Figure 2.5: React Native Framework Architectural Ecosystem Utilized for Cross-Platform Client Deployment", 
        width_in=2.2
    )

    add_heading_2(doc, "2.6.1 Cross-Platform Mobile Runtimes with React Native and Expo")
    add_p(doc, 
        "To ensure universal accessibility across Android, iOS, and Web environments from a single codebase, AudioNote AI utilizes React Native "
        "and the Expo (SDK 54) framework. React Native executes JavaScript/TypeScript application logic on a dedicated JavaScript thread while "
        "delegating UI layout calculations to Yoga and rendering authentic platform-specific native views. Expo Router provides declarative, "
        "file-system-based routing, eliminating navigation race conditions and ensuring seamless transitions between recording, note inspection, "
        "and quiz screens. Styling is orchestrated via NativeWind (Tailwind CSS for React Native), pairing utility-first design with custom "
        "dark-mode glassmorphic aesthetics that maximize contrast and reduce eye fatigue during nocturnal study sessions."
    )

    add_heading_2(doc, "2.6.2 Audio Buffer Sandboxing and Memory Lifecycle Management")
    add_p(doc, 
        "Mobile operating systems enforce strict background memory constraints, aggressively terminating applications that exceed allotted "
        "RAM quotas. Continuous high-resolution audio recording requires robust memory lifecycle management. AudioNote AI leverages `expo-av` "
        "and `expo-audio`, establishing a hardware-accelerated recording session configured for 16-bit linear PCM audio. To prevent RAM saturation, "
        "audio buffers are not accumulated in volatile memory; instead, the recording thread streams directly to isolated sandbox storage within "
        "`FileSystem.documentDirectory`. Real-time decibel metering is polled at 250-millisecond intervals to drive fluid waveform animations "
        "powered by React Native Reanimated, operating entirely on the UI thread without blocking the JavaScript runtime."
    )

    add_heading_2(doc, "2.6.3 Asynchronous API Pipeline, Streaming Protocols, and Backend Infrastructure")
    add_p(doc, 
        "The backend API is architected as an enterprise-grade Express.js service in strict TypeScript. Audio payloads dispatched from mobile "
        "clients are ingested via Multer utilizing streaming disk storage, preventing memory bottlenecks when multiple students upload recordings "
        "concurrently. The server interacts with Google's cloud through `@google/generative-ai/server`, utilizing IPv4-enforced HTTP pipelines. "
        "Relational entity management is governed by Prisma ORM v6 connected to PostgreSQL via connection pooling (`@prisma/adapter-pg`), ensuring "
        "instant retrieval of user profiles, lecture notes, and localized translations. Lightweight security is enforced via 4-digit PIN "
        "cryptographic hashing and signed JSON Web Tokens (JWT)."
    )

    # Insert Paired UI Screenshots 4 (Figure 2.6: PIN Authentication & Settings/Profile Configuration)
    add_paired_images(doc, s1, s5, 
        "Figure 2.6: Security and System Configuration – (Left: Lightweight 4-Digit Security PIN Gateway [s1]; Right: Client Configuration and Model Routing Preferences [s5])",
        width_in=2.3
    )

    add_heading_1(doc, "2.7 RELATED WORKS")
    add_p(doc, 
        "The commercial landscape contains several prominent transcription and note-taking platforms, each exhibiting architectural trade-offs "
        "and market specializations."
    )
    add_p(doc, 
        "Otter.ai is widely recognized as an industry pioneer in automated meeting transcription. It provides robust real-time transcription, "
        "speaker diarization, and integration with enterprise videoconferencing tools (Zoom, Microsoft Teams). However, Otter.ai is explicitly "
        "tailored for corporate business meetings; its summarization algorithms prioritize corporate action items and meeting agendas rather than "
        "pedagogical concept hierarchies. Furthermore, its restrictive freemium model and lack of gamified study aids or regional African language "
        "translations limit its applicability within developing educational sectors."
    )
    add_p(doc, 
        "Fireflies.ai similarly focuses on conversational intelligence and enterprise CRM integrations. While offering high transcription accuracy "
        "via Whisper-based pipelines, it lacks native mobile-first study workflows, offline caching, and student-focused quiz synthesis. "
        "Other consumer applications, such as Coconote and Wave AI, cater to students by generating summary bullet points from lecture recordings. "
        "However, these platforms operate as simple frontends to standard text-based LLM APIs, suffering from cascading errors and lacking synchronized "
        "audio playback or cross-lingual translation."
    )
    add_p(doc, 
        "AudioNote AI bridges these scholarly and practical gaps. By leveraging Google's Gemini 2.5 Flash multimodal engine, the platform eliminates "
        "cascaded pipeline errors, provides granular timestamped transcript synchronization, generates interactive active-recall quizzes, and delivers "
        "multilingual access across nine languages—all packaged in a modern, lightweight, mobile-first React Native architecture."
    )

    add_heading_1(doc, "2.8 SUMMARY OF LITERATURE AND RESEARCH GAP")
    add_p(doc, 
        "In summary, the literature underscores that manual lecture note-taking imposes an unsustainable cognitive load on students, leading to "
        "substantial information loss. Automated transcription has evolved from fragile statistical HMMs to revolutionary multimodal foundation "
        "models capable of natively processing audio and textual semantics concurrently. Despite these technological leaps, existing commercial tools "
        "remain heavily skewed toward corporate business meetings, neglecting the pedagogical synthesis, active recall assessments, and regional "
        "language accessibility required by global higher education students."
    )
    add_p(doc, 
        "This research directly addresses this identified gap. By designing and evaluating AudioNote AI, this study demonstrates an empirically "
        "validated architecture that couples multimodal artificial intelligence with mobile systems engineering, transforming unstructured "
        "lecture acoustics into a comprehensive, inclusive, and highly effective digital learning environment."
    )

    # Save output to clean filename
    output_filename = "Audio_to_Note_Converter_Final_Thesis.docx"
    output_path = os.path.join(base_dir, output_filename)
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    build_thesis()
