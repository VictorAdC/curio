export type SupportedLocale = 'en' | 'pt-BR';

type TranslationDictionary = Record<string, string>;

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  'pt-BR': 'Português',
};

export const LOCALE_CODES: Record<SupportedLocale, string> = {
  en: 'en-US',
  'pt-BR': 'pt-BR',
};

export const messages: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    'language.label': 'Language',
    'language.english': 'English',
    'language.portuguese': 'Portuguese',

    'practice.header.eyebrow': 'Curio practice studio',
    'practice.header.title': 'Practice page',
    'practice.header.description':
      'Load local media or a YouTube performance, navigate precisely through the timeline, and build loop-based study sessions with notes.',
    'practice.sessions.button': 'Sessions',
    'practice.sessions.savedEyebrow': 'Saved sessions',
    'practice.sessions.close': 'Close',
    'practice.sessions.dialogLabel': 'Session history',
    'practice.sessions.closeAria': 'Close session history',

    'practice.player.nowPracticing': 'Now practicing',
    'practice.player.waitingForSource': 'Waiting for a source',
    'practice.player.hiddenMediaRelink': 'Re-upload media',
    'practice.player.error.missingMedia':
      'Local media is missing for "{title}". Import a full backup or re-upload the original file to play it.',
    'practice.player.error.unsupportedFile': 'Unsupported file type. Please upload an audio or video file.',
    'practice.player.error.invalidYoutube': 'Invalid YouTube URL. Please use a valid YouTube link.',
    'practice.player.error.relinkWarning':
      'This file differs from the original session media ({details}). Use it anyway?',
    'practice.player.error.relinkDetail.name': 'file name',
    'practice.player.error.relinkDetail.type': 'file type',
    'practice.player.error.relinkDetail.size': 'file size',
    'practice.player.error.relinkDetail.lastModified': 'last modified date',

    'practice.summary.readiness': 'Readiness',
    'practice.summary.readiness.ready': 'Ready',
    'practice.summary.readiness.loading': 'Loading metadata',
    'practice.summary.markers': 'Markers',
    'practice.summary.loop': 'Loop',
    'practice.summary.loop.active': 'Active',
    'practice.summary.loop.inactive': 'Inactive',

    'practice.controls.addMarker': 'Add marker',
    'practice.controls.clearLoop': 'Clear loop',
    'practice.controls.loopStart': 'Loop start',
    'practice.controls.loopEnd': 'Loop end',

    'practice.markerSpotlight.label': 'Marker',
    'practice.markerSpotlight.emptyNote':
      'Add a note to this marker to keep contextual practice guidance here.',

    'practice.media.youtubePlaceholder': 'Paste a YouTube link',
    'practice.media.load': 'Load',
    'practice.media.or': 'or',
    'practice.media.localFile': 'load a local audio or video file',

    'practice.sessionNotes.title': 'Session notes',
    'practice.sessionNotes.saved': 'Saved locally for this practice session.',
    'practice.sessionNotes.placeholder':
      'Write general observations for the session, phrasing reminders, or passages to revisit...',

    'practice.markerList.title': 'Markers & loop points',
    'practice.markerList.description': 'Create reference points and assign one start and one end loop marker.',
    'practice.markerList.empty': 'No markers yet. Add one at the current playback position.',
    'practice.markerList.setStart': 'Set start',
    'practice.markerList.unsetStart': 'Unset start',
    'practice.markerList.setEnd': 'Set end',
    'practice.markerList.unsetEnd': 'Unset end',
    'practice.markerList.remove': 'Remove',
    'practice.markerList.role.marker': 'Marker',
    'practice.markerList.role.loopStart': 'Loop start',
    'practice.markerList.role.loopEnd': 'Loop end',
    'practice.markerEditor.notePlaceholder': 'Add a note for this practice moment...',

    'practice.transport.backward': '-10s',
    'practice.transport.forward': '+10s',
    'practice.transport.play': 'Play',
    'practice.transport.pause': 'Pause',

    'practice.timeline.seekMediaAria': 'Seek through media timeline',
    'practice.timeline.seekWaveformAria': 'Seek through audio waveform',
    'practice.timeline.markersCount': 'Markers: {count}',

    'practice.sessionHistory.title': 'Session history',
    'practice.sessionHistory.description': 'Reload a previous session or rename it for easier recall.',
    'practice.sessionHistory.empty': 'No sessions yet. Load a source to start your first one.',
    'practice.sessionHistory.editing': 'Editing',
    'practice.sessionHistory.open': 'Open',
    'practice.sessionHistory.mediaMissing': 'Media missing',
    'practice.sessionHistory.delete': 'Delete',
    'practice.sessionHistory.download': 'Download copy',
    'practice.sessionHistory.upload': 'Upload copy',
    'practice.sessionHistory.clearAll': 'Clear all',
    'practice.sessionHistory.clearAllConfirm':
      'Clear all saved sessions? This will remove all saved notes, markers, and local media snapshots.',
    'practice.sessionHistory.deleteConfirm':
      'Delete session "{name}"? This will remove its saved notes, markers, and local media snapshot.',
    'practice.sessionHistory.nameAria': 'Session name for {title}',
    'practice.sessionHistory.backupDialogLabel': 'Choose backup type',
    'practice.sessionHistory.backupTitle': 'Choose backup type',
    'practice.sessionHistory.backupCloseAria': 'Close backup options',
    'practice.sessionHistory.importDialogLabel': 'Choose import sessions',
    'practice.sessionHistory.importTitle': 'Import sessions',
    'practice.sessionHistory.importCloseAria': 'Close import options',
    'practice.sessionHistory.modalClose': 'Close',
    'practice.sessionHistory.backupIntro':
      'Light copies are smaller. Full copies include saved local audio and video, which can make the file much larger.',
    'practice.sessionHistory.importIntro':
      'Choose which sessions to import and whether they should replace your current ones or be appended to them.',
    'practice.sessionHistory.scope': 'What to include',
    'practice.sessionHistory.selectAll': 'Select all',
    'practice.sessionHistory.deselectAll': 'Deselect all',
    'practice.sessionHistory.lightCopy': 'Light copy',
    'practice.sessionHistory.lightCopyDescription':
      'Session data only. Local media must be relinked after import.',
    'practice.sessionHistory.fullCopy': 'Full copy',
    'practice.sessionHistory.fullCopyDescription':
      'Includes saved local audio and video for complete restoration.',
    'practice.sessionHistory.importMode': 'Import mode',
    'practice.sessionHistory.append': 'Append',
    'practice.sessionHistory.replaceCurrent': 'Replace current',
    'practice.sessionHistory.sessionsToImport': 'Sessions to import',
    'practice.sessionHistory.collisionLabel': 'If a session already exists',
    'practice.sessionHistory.replaceIt': 'Replace it',
    'practice.sessionHistory.duplicateIt': 'Duplicate it',
    'practice.sessionHistory.importSelected': 'Import selected sessions',
    'practice.sessionHistory.importReplaceDescription': 'Current saved sessions will be cleared before import.',
    'practice.sessionHistory.importAppendDescription': 'Selected sessions will be added to your current saved sessions.',

    'practice.sourceKind.local-audio': 'local audio',
    'practice.sourceKind.local-video': 'local video',
    'practice.sourceKind.youtube': 'YouTube',
  },
  'pt-BR': {
    'language.label': 'Idioma',
    'language.english': 'Inglês',
    'language.portuguese': 'Português',

    'practice.header.eyebrow': 'Estúdio de prática Curio',
    'practice.header.title': 'Página de prática',
    'practice.header.description':
      'Carregue mídia local ou uma performance do YouTube, navegue com precisão pela linha do tempo e monte sessões de estudo com loops e notas.',
    'practice.sessions.button': 'Sessões',
    'practice.sessions.savedEyebrow': 'Sessões salvas',
    'practice.sessions.close': 'Fechar',
    'practice.sessions.dialogLabel': 'Histórico de sessões',
    'practice.sessions.closeAria': 'Fechar histórico de sessões',

    'practice.player.nowPracticing': 'Praticando agora',
    'practice.player.waitingForSource': 'Aguardando uma fonte',
    'practice.player.hiddenMediaRelink': 'Reenviar mídia',
    'practice.player.error.missingMedia':
      'A mídia local de "{title}" está ausente. Importe um backup completo ou reenvie o arquivo original para reproduzi-la.',
    'practice.player.error.unsupportedFile': 'Tipo de arquivo não suportado. Envie um arquivo de áudio ou vídeo.',
    'practice.player.error.invalidYoutube': 'URL do YouTube inválida. Use um link válido do YouTube.',
    'practice.player.error.relinkWarning':
      'Este arquivo é diferente da mídia original da sessão ({details}). Deseja usá-lo mesmo assim?',
    'practice.player.error.relinkDetail.name': 'nome do arquivo',
    'practice.player.error.relinkDetail.type': 'tipo do arquivo',
    'practice.player.error.relinkDetail.size': 'tamanho do arquivo',
    'practice.player.error.relinkDetail.lastModified': 'data de modificação',

    'practice.summary.readiness': 'Prontidão',
    'practice.summary.readiness.ready': 'Pronto',
    'practice.summary.readiness.loading': 'Carregando metadados',
    'practice.summary.markers': 'Marcadores',
    'practice.summary.loop': 'Loop',
    'practice.summary.loop.active': 'Ativo',
    'practice.summary.loop.inactive': 'Inativo',

    'practice.controls.addMarker': 'Adicionar marcador',
    'practice.controls.clearLoop': 'Limpar loop',
    'practice.controls.loopStart': 'Início do loop',
    'practice.controls.loopEnd': 'Fim do loop',

    'practice.markerSpotlight.label': 'Marcador',
    'practice.markerSpotlight.emptyNote':
      'Adicione uma nota a este marcador para manter uma orientação contextual de prática aqui.',

    'practice.media.youtubePlaceholder': 'Cole um link do YouTube',
    'practice.media.load': 'Carregar',
    'practice.media.or': 'ou',
    'practice.media.localFile': 'carregar um arquivo local de áudio ou vídeo',

    'practice.sessionNotes.title': 'Notas da sessão',
    'practice.sessionNotes.saved': 'Salvo localmente para esta sessão de prática.',
    'practice.sessionNotes.placeholder':
      'Escreva observações gerais da sessão, lembretes de fraseado ou trechos para revisar...',

    'practice.markerList.title': 'Marcadores e pontos de loop',
    'practice.markerList.description': 'Crie pontos de referência e defina um marcador de início e um de fim para o loop.',
    'practice.markerList.empty': 'Ainda não há marcadores. Adicione um na posição atual da reprodução.',
    'practice.markerList.setStart': 'Definir início',
    'practice.markerList.unsetStart': 'Remover início',
    'practice.markerList.setEnd': 'Definir fim',
    'practice.markerList.unsetEnd': 'Remover fim',
    'practice.markerList.remove': 'Remover',
    'practice.markerList.role.marker': 'Marcador',
    'practice.markerList.role.loopStart': 'Loop início',
    'practice.markerList.role.loopEnd': 'Loop fim',
    'practice.markerEditor.notePlaceholder': 'Adicione uma nota para este momento de prática...',

    'practice.transport.backward': '-10s',
    'practice.transport.forward': '+10s',
    'practice.transport.play': 'Tocar',
    'practice.transport.pause': 'Pausar',

    'practice.timeline.seekMediaAria': 'Buscar na linha do tempo da mídia',
    'practice.timeline.seekWaveformAria': 'Buscar na forma de onda do áudio',
    'practice.timeline.markersCount': 'Marcadores: {count}',

    'practice.sessionHistory.title': 'Histórico de sessões',
    'practice.sessionHistory.description': 'Reabra uma sessão anterior ou renomeie-a para facilitar a identificação.',
    'practice.sessionHistory.empty': 'Ainda não há sessões. Carregue uma fonte para iniciar a primeira.',
    'practice.sessionHistory.editing': 'Editando',
    'practice.sessionHistory.open': 'Aberta',
    'practice.sessionHistory.mediaMissing': 'Mídia ausente',
    'practice.sessionHistory.delete': 'Excluir',
    'practice.sessionHistory.download': 'Baixar cópia',
    'practice.sessionHistory.upload': 'Enviar cópia',
    'practice.sessionHistory.clearAll': 'Limpar tudo',
    'practice.sessionHistory.clearAllConfirm':
      'Limpar todas as sessões salvas? Isso removerá todas as notas, marcadores e mídias locais salvas.',
    'practice.sessionHistory.deleteConfirm':
      'Excluir a sessão "{name}"? Isso removerá suas notas, marcadores e a cópia local da mídia.',
    'practice.sessionHistory.nameAria': 'Nome da sessão para {title}',
    'practice.sessionHistory.backupDialogLabel': 'Escolher tipo de backup',
    'practice.sessionHistory.backupTitle': 'Escolher tipo de backup',
    'practice.sessionHistory.backupCloseAria': 'Fechar opções de backup',
    'practice.sessionHistory.importDialogLabel': 'Escolher sessões para importar',
    'practice.sessionHistory.importTitle': 'Importar sessões',
    'practice.sessionHistory.importCloseAria': 'Fechar opções de importação',
    'practice.sessionHistory.modalClose': 'Fechar',
    'practice.sessionHistory.backupIntro':
      'Cópias leves são menores. Cópias completas incluem áudio e vídeo locais salvos, o que pode aumentar bastante o arquivo.',
    'practice.sessionHistory.importIntro':
      'Escolha quais sessões importar e se elas devem substituir as atuais ou ser adicionadas a elas.',
    'practice.sessionHistory.scope': 'O que incluir',
    'practice.sessionHistory.selectAll': 'Selecionar tudo',
    'practice.sessionHistory.deselectAll': 'Desmarcar tudo',
    'practice.sessionHistory.lightCopy': 'Cópia leve',
    'practice.sessionHistory.lightCopyDescription':
      'Apenas dados da sessão. A mídia local precisará ser vinculada novamente após a importação.',
    'practice.sessionHistory.fullCopy': 'Cópia completa',
    'practice.sessionHistory.fullCopyDescription':
      'Inclui áudio e vídeo locais salvos para restauração completa.',
    'practice.sessionHistory.importMode': 'Modo de importação',
    'practice.sessionHistory.append': 'Adicionar',
    'practice.sessionHistory.replaceCurrent': 'Substituir atuais',
    'practice.sessionHistory.sessionsToImport': 'Sessões para importar',
    'practice.sessionHistory.collisionLabel': 'Se a sessão já existir',
    'practice.sessionHistory.replaceIt': 'Substituir',
    'practice.sessionHistory.duplicateIt': 'Duplicar',
    'practice.sessionHistory.importSelected': 'Importar sessões selecionadas',
    'practice.sessionHistory.importReplaceDescription': 'As sessões salvas atuais serão apagadas antes da importação.',
    'practice.sessionHistory.importAppendDescription': 'As sessões selecionadas serão adicionadas às sessões salvas atuais.',

    'practice.sourceKind.local-audio': 'áudio local',
    'practice.sourceKind.local-video': 'vídeo local',
    'practice.sourceKind.youtube': 'YouTube',
  },
};
