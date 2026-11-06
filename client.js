window.__ModuleLoader__.load({
  id: 'dsh-system-monitor',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const useState = React.useState;
    const useEffect = React.useEffect;
    const useMemo = React.useMemo;
    const useCallback = React.useCallback;

    const NS = 'systemMonitor';
    const PANEL_ID = 'system-monitor';
    const SNAPSHOT_ROUTE = 'system-monitor/snapshot';
    const REFRESH_ROUTE = 'system-monitor/refresh';
    const ACTION_ROUTE = 'system-monitor/action';
    const TRANSITIONS_ROUTE = 'system-monitor/transitions';
    const ISSUE_ROUTE = 'system-monitor/jira/issue';
    const DOCKER_LOG_ROUTE = 'system-monitor/docker/logs';
    const IMAGE_ROUTE = 'system-monitor/image';
    const TODOS_ROUTE = 'system-monitor/todos';
    /** Must match `schemaVersion` in the Host snapshot. */
    const HOST_SCHEMA = 3;
    const POLL_MS = 2000;

    /* --------------------------------------------------------------- i18n */

    const en = {
      meta: {
        title: 'System monitor',
        description:
          'Live CPU, memory, disk and network graphs for this machine, plus Docker, Colima, Kubernetes and DevSpace status.',
      },
      panel: 'System',
      eyebrow: 'System monitor',
      live: 'Live',
      paused: 'Paused',
      waiting: 'Waiting for the host',
      updated: 'Updated',
      refresh: 'Refresh measurements',
      refreshing: 'Refreshing',
      offline: 'Host unreachable',
      retrying: 'Retrying…',
      uptimeLabel: 'up',
      coresLabel: 'cores',
      loadLabel: 'load',
      cpu: 'Processor',
      memory: 'Memory',
      disk: 'Disk',
      network: 'Network',
      swap: 'Swap',
      swapOf: 'of swap',
      used: 'Used',
      free: 'Free',
      cached: 'Cache',
      wired: 'Wired',
      compressed: 'Compressed',
      app: 'Apps',
      down: 'Down',
      up: 'Up',
      receive: 'received',
      transmit: 'sent',
      total: 'total',
      available: 'available',
      chartTitle: 'Throughput over time',
      chartHint: 'Move the pointer across the chart to read a sample.',
      range1: '1 min',
      range3: '3 min',
      range6: '6 min',
      min: 'min',
      avg: 'avg',
      max: 'max',
      samples: 'samples',
      collecting: 'Collecting samples…',
      docker: 'Docker',
      colima: 'Colima',
      kubernetes: 'Kubernetes',
      devspace: 'DevSpace',
      containers: 'containers',
      running: 'running',
      stopped: 'stopped',
      images: 'images',
      engine: 'engine',
      driver: 'driver',
      profile: 'profile',
      runtime: 'runtime',
      arch: 'arch',
      vcpu: 'vCPU',
      vmMemory: 'VM memory',
      vmDisk: 'VM disk',
      socket: 'socket',
      context: 'context',
      contexts: 'contexts',
      nodes: 'nodes',
      pods: 'pods',
      restarts: 'restarts',
      deployments: 'deployments',
      degraded: 'degraded',
      namespaces: 'namespaces',
      sessions: 'sessions',
      session: 'session',
      plugins: 'plugins',
      project: 'project',
      dependencies: 'dependencies',
      version: 'version',
      clusterVersion: 'cluster',
      ready: 'ready',
      notReady: 'not ready',
      connected: 'Connected',
      disconnected: 'Disconnected',
      active: 'Active',
      inactive: 'Inactive',
      none: 'None',
      noData: 'No data',
      unavailable: 'Unavailable',
      notInstalled: 'Not installed',
      containerTable: 'Containers',
      containerName: 'Container',
      containerImage: 'Image',
      containerState: 'State',
      containerCpu: 'CPU',
      containerMemory: 'Memory',
      containerPids: 'PIDs',
      processesTable: 'Busiest processes',
      processName: 'Process',
      processMemory: 'MEM',
      pending: 'pending',
      succeeded: 'completed',
      failed: 'failed',
      actions: 'Actions',
      restart: 'Restart',
      stop: 'Stop',
      start: 'Start',
      confirm: 'Confirm',
      ports: 'Ports',
      none: 'none',
      vmStart: 'Start the VM',
      vmStop: 'Stop the VM',
      mount: 'Mount',
      kubernetesInVm: 'Kubernetes in VM',
      dockerSocket: 'Docker socket',
      node: 'Node',
      nodePlural: 'Nodes',
      capacity: 'Capacity',
      blockedPods: 'Blocked pods',
      noBlockedPods: 'No blocked pod',
      recentWarnings: 'Recent warnings',
      noWarnings: 'No recent warning',
      degradedDeployments: 'Deployments to watch',
      allDeploymentsHealthy: 'Every deployment is ready',
      switchContext: 'Switch context',
      rolloutRestart: 'Restart the rollout',
      stopSession: 'Stop the session',
      installedPlugins: 'Installed plugins',
      actionDone: 'Done',
      actionFailed: 'Failed',
      totalCpu: 'CPU used',
      totalMemory: 'Memory used',
      healthIssues: 'Unhealthy',
      unhealthy: 'Needs attention',
      fallbackError: 'This panel could not be rendered.',
      reload: 'Close and reopen the panel to try again.',
      sampleRange: 'last',
      noHistory: 'Not enough samples yet',
      tabSystem: 'System',
      tabK8s: 'Kubernetes',
      tabProject: 'Project',
      staleHost: 'The plugin host is older than this interface',
      staleHostHint: 'Quit and relaunch the application to load the current Host modules.',
      tabTodos: 'To-do',
      todoPlaceholder: 'Something to do…',
      todoAdd: 'Add',
      todoOpen: 'Open',
      todoToday: 'Due today or late',
      todoDone: 'Done',
      todoHigh: 'High',
      todoNormal: 'Normal',
      todoLow: 'Low',
      todoDelete: 'Delete',
      todoClearDone: 'Clear the done items',
      todoFilterOpen: 'Open',
      todoFilterToday: 'Today',
      todoFilterDone: 'Done',
      todoEmpty: 'Nothing here — enjoy it.',
      todoWeek: 'This week',
      tabVeille: 'Tech & AI watch',
      tabCyber: 'Cyber watch',
      articles: 'Articles',
      sources: 'Sources',
      illustrated: 'With a picture',
      alerts: 'Alerts',
      lastRefresh: 'Updated',
      nextRefresh: 'Cadence',
      published: 'Published',
      severity: 'Severity',
      package: 'Package',
      certAlerts: 'CERT-FR alerts',
      certAdvisories: 'CERT-FR advisories',
      criticalCve: 'Critical CVEs',
      trackedCve: 'Tracked CVEs',
      attackNews: 'Cyberattacks',
      importantNews: 'Important right now',

      openIssues: 'Open',
      created7: 'Created 7 d',
      resolved7: 'Resolved 7 d',
      created30: 'Created 30 d',
      resolved30: 'Resolved 30 d',
      netFlow: 'Net flow',
      overdue: 'Overdue',
      unassigned: 'Unassigned',
      flow30: 'Flow over 30 days',
      byAssignee: 'Load by assignee',
      byEpic: 'Load by epic',
      sample: 'Sample',
      sync: 'Synced',

      tabDocker: 'Docker',
      tabProcesses: 'Processes',
      tabNetwork: 'Network',
      tabSecurity: 'Security',
      tabGithub: 'GitHub',
      tabConfluence: 'Confluence',
      namespace: 'Namespace',
      age: 'Age',
      deletePod: 'Delete the pod',
      volumes: 'Volumes',
      networks: 'Networks',
      processCount: 'Processes',
      residentMemory: 'Resident',
      elapsed: 'Elapsed',
      killProcess: 'Stop the process',
      listeningPorts: 'Listening ports',
      exposedPorts: 'Exposed ports',
      port: 'Port',
      bind: 'Bind',
      exposed: 'exposed',
      interfaces: 'Interfaces',
      diskEncryption: 'Disk encryption',
      firewall: 'Firewall',
      systemIntegrity: 'System integrity',
      appNotarization: 'App notarization',
      enabled: 'enabled',
      disabled: 'disabled',
      thisMachine: 'This machine',
      hostname: 'Host',
      os: 'System',
      lastUpdate: 'Last update',
      reminders: 'Worth a look',
      fileVaultOff: 'FileVault is off: the disk is not encrypted.',
      allGood: 'Nothing to report.',
      ghNotAuthenticated: 'gh is not signed in on this machine',
      repository: 'Repository',
      repositories: 'Repositories',
      containerLogs: 'Container logs',
      exposedOnly: 'Exposed only',

      size: 'Size',
      chipLabel: 'Chip',
      reviewRequests: 'Review requested',
      openPullRequests: 'Open pull requests',
      assignedIssues: 'Assigned issues',
      notifications: 'Notifications',
      account: 'Account',
      space: 'Space',
      author: 'Author',
      spaces: 'Spaces',
      recentPages: 'Recent pages',
      myContributions: 'My contributions',

      tabJira: 'Jira',
      jiraSynced: 'Synced',
      jiraNotConfigured: 'Jira is not configured',
      jiraMissingHint: 'Set these variables, then restart the app:',
      jiraAuthFailed: 'Jira refused the credentials',
      jiraUnreachable: 'Jira is unreachable',
      jiraQueryFailed: 'The Jira query failed',
      jiraOpenBoard: 'Open the board',
      jiraWorkload: 'Work queue',
      jiraFilterAll: 'All',
      jiraFilterMine: 'Mine',
      jiraFilterBlocked: 'Blocked',
      jiraFilterDue: 'Due',
      jiraTicket: 'Ticket',
      jiraSummary: 'Summary',
      jiraStatus: 'Status',
      jiraPriority: 'Priority',
      jiraAssignee: 'Assignee',
      jiraDue: 'Due',
      jiraPoints: 'Pts',
      jiraDistribution: 'Status breakdown',
      jiraByPriority: 'Load by priority',
      jiraWatch: 'Needs attention',
      jiraNothingToWatch: 'Nothing is blocked or overdue',
      jiraMove: 'Move this ticket',
      jiraMoveTo: 'Move to',
      jiraMoveDone: 'Ticket moved',
      jiraOverdue: 'Overdue',
      jiraBlocked: 'Blocked',
      jiraUnassigned: 'Unassigned',
      jiraDayLeft: 'd left',
      jiraToday: 'today',
      jiraLate: 'late by',
      jiraInDays: 'in',
      jiraTicketLower: 'tickets',
      jiraDone: 'done',
      jiraSprint: 'Sprint',
      jiraProject: 'Project',
      jiraNoIssues: 'No ticket matches this filter',
      jiraSearch: 'Filter by key or title…',
      statusTodo: 'To do',
      statusProgress: 'In progress',
      statusReview: 'In review',
      statusDone: 'Done',
      jiraBlockedOne: 'blocked',
      jiraBlockedBadge: 'blocked',
      jiraTokenSources: 'Credentials tried',
      close: 'Close',
      loading: 'Loading…',
      working: 'Working…',
      reporter: 'Reporter',
      labels: 'Labels',
      epic: 'Epic',
      subtasks: 'Subtasks',
      description: 'Description',
      noDescription: 'No description',
      activity: 'Activity',
      jiraOpen: 'Open in Jira',
      readOnly: 'Read-only: nothing here changes your system.',
    };

    const fr = {
      meta: {
        title: 'Moniteur système',
        description:
          'Graphiques en direct du CPU, de la mémoire, du disque et du réseau, avec l’état de Docker, Colima, Kubernetes et DevSpace.',
      },
      panel: 'Système',
      eyebrow: 'Moniteur système',
      live: 'En direct',
      paused: 'En pause',
      waiting: 'Connexion à l’hôte',
      updated: 'Mis à jour',
      refresh: 'Rafraîchir les mesures',
      refreshing: 'Actualisation',
      offline: 'Hôte injoignable',
      retrying: 'Nouvelle tentative…',
      uptimeLabel: 'actif depuis',
      coresLabel: 'cœurs',
      loadLabel: 'charge',
      cpu: 'Processeur',
      memory: 'Mémoire',
      disk: 'Disque',
      network: 'Réseau',
      swap: 'Swap',
      swapOf: 'du swap',
      used: 'Utilisée',
      free: 'Libre',
      cached: 'Cache',
      wired: 'Câblée',
      compressed: 'Comprimée',
      app: 'Apps',
      down: 'Descendant',
      up: 'Montant',
      receive: 'reçus',
      transmit: 'émis',
      total: 'au total',
      available: 'disponible',
      chartTitle: 'Débit dans le temps',
      chartHint: 'Survolez le graphique pour lire un instant précis.',
      range1: '1 min',
      range3: '3 min',
      range6: '6 min',
      min: 'min',
      avg: 'moy',
      max: 'max',
      samples: 'échantillons',
      collecting: 'Collecte des mesures…',
      docker: 'Docker',
      colima: 'Colima',
      kubernetes: 'Kubernetes',
      devspace: 'DevSpace',
      containers: 'conteneurs',
      running: 'actifs',
      stopped: 'arrêtés',
      images: 'images',
      engine: 'moteur',
      driver: 'driver',
      profile: 'profil',
      runtime: 'runtime',
      arch: 'arch',
      vcpu: 'vCPU',
      vmMemory: 'Mémoire VM',
      vmDisk: 'Disque VM',
      socket: 'socket',
      context: 'contexte',
      contexts: 'contextes',
      nodes: 'nœuds',
      pods: 'pods',
      restarts: 'redémarrages',
      deployments: 'déploiements',
      degraded: 'en défaut',
      namespaces: 'namespaces',
      sessions: 'sessions',
      session: 'session',
      plugins: 'plugins',
      project: 'projet',
      dependencies: 'dépendances',
      version: 'version',
      clusterVersion: 'cluster',
      ready: 'prêt',
      notReady: 'non prêt',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      active: 'Actif',
      inactive: 'Inactif',
      none: 'Aucun',
      noData: 'Aucune donnée',
      unavailable: 'Indisponible',
      notInstalled: 'Non installé',
      containerTable: 'Conteneurs',
      containerName: 'Conteneur',
      containerImage: 'Image',
      containerState: 'État',
      containerCpu: 'CPU',
      containerMemory: 'Mémoire',
      containerPids: 'PIDs',
      processesTable: 'Processus les plus actifs',
      processName: 'Processus',
      processMemory: 'MEM',
      pending: 'en attente',
      succeeded: 'terminés',
      failed: 'en échec',
      actions: 'Actions',
      restart: 'Redémarrer',
      stop: 'Arrêter',
      start: 'Démarrer',
      confirm: 'Confirmer',
      ports: 'Ports',
      none: 'aucun',
      vmStart: 'Démarrer la VM',
      vmStop: 'Arrêter la VM',
      mount: 'Montage',
      kubernetesInVm: 'Kubernetes dans la VM',
      dockerSocket: 'Socket Docker',
      node: 'Nœud',
      nodePlural: 'Nœuds',
      capacity: 'Capacité',
      blockedPods: 'Pods bloqués',
      noBlockedPods: 'Aucun pod bloqué',
      recentWarnings: 'Avertissements récents',
      noWarnings: 'Aucun avertissement récent',
      degradedDeployments: 'Déploiements à surveiller',
      allDeploymentsHealthy: 'Tous les déploiements sont prêts',
      switchContext: 'Changer de contexte',
      rolloutRestart: 'Relancer le déploiement',
      stopSession: 'Arrêter la session',
      installedPlugins: 'Plugins installés',
      actionDone: 'Terminé',
      actionFailed: 'Échec',
      totalCpu: 'CPU consommé',
      totalMemory: 'Mémoire utilisée',
      healthIssues: 'En défaut',
      unhealthy: 'À surveiller',
      fallbackError: 'Ce panneau n’a pas pu être affiché.',
      reload: 'Fermez puis rouvrez le panneau pour réessayer.',
      sampleRange: 'sur',
      noHistory: 'Pas encore assez de mesures',
      tabSystem: 'Système',
      tabK8s: 'Kubernetes',
      tabProject: 'Project',
      staleHost: 'Le plugin hôte est plus ancien que cette interface',
      staleHostHint: 'Quitte puis relance l’application pour charger les modules à jour.',
      tabTodos: 'Tâches',
      todoPlaceholder: 'Une chose à faire…',
      todoAdd: 'Ajouter',
      todoOpen: 'En cours',
      todoToday: 'Dues ou en retard',
      todoDone: 'Terminées',
      todoHigh: 'Haute',
      todoNormal: 'Normale',
      todoLow: 'Basse',
      todoDelete: 'Supprimer',
      todoClearDone: 'Vider les tâches terminées',
      todoFilterOpen: 'À faire',
      todoFilterToday: "Aujourd'hui",
      todoFilterDone: 'Terminées',
      todoEmpty: 'Rien ici — profites-en.',
      todoWeek: 'Cette semaine',
      tabVeille: 'Veille tech & IA',
      tabCyber: 'Veille cyber',
      articles: 'Articles',
      sources: 'Sources',
      illustrated: 'Avec visuel',
      alerts: 'Alertes',
      lastRefresh: 'Mis à jour',
      nextRefresh: 'Cadence',
      published: 'Publié',
      severity: 'Sévérité',
      package: 'Paquet',
      certAlerts: 'Alertes CERT-FR',
      certAdvisories: 'Avis CERT-FR',
      criticalCve: 'CVE critiques',
      trackedCve: 'CVE suivies',
      attackNews: 'Cyberattaques',
      importantNews: 'Important maintenant',
      openIssues: 'Ouverts',
      created7: 'Créés 7 j',
      resolved7: 'Résolus 7 j',
      created30: 'Créés 30 j',
      resolved30: 'Résolus 30 j',
      netFlow: 'Flux net',
      overdue: 'En retard',
      unassigned: 'Non assignés',
      flow30: 'Flux sur 30 jours',
      byAssignee: 'Charge par assigné',
      byEpic: 'Charge par epic',
      sample: 'Échantillon',
      sync: 'Synchronisé',
      tabDocker: 'Docker',
      tabProcesses: 'Processus',
      tabNetwork: 'Réseau',
      tabSecurity: 'Sécurité',
      tabGithub: 'GitHub',
      tabConfluence: 'Confluence',
      namespace: 'Namespace',
      age: 'Âge',
      deletePod: 'Supprimer le pod',
      volumes: 'Volumes',
      networks: 'Réseaux',
      processCount: 'Processus',
      residentMemory: 'Résident',
      elapsed: 'Durée',
      killProcess: 'Arrêter le processus',
      listeningPorts: 'Ports en écoute',
      exposedPorts: 'Ports exposés',
      port: 'Port',
      bind: 'Écoute',
      exposed: 'exposé',
      interfaces: 'Interfaces',
      diskEncryption: 'Chiffrement du disque',
      firewall: 'Pare-feu',
      systemIntegrity: 'Intégrité système',
      appNotarization: 'Notarisation des apps',
      enabled: 'activé',
      disabled: 'désactivé',
      thisMachine: 'Cette machine',
      hostname: 'Hôte',
      os: 'Système',
      lastUpdate: 'Dernière mise à jour',
      reminders: 'À regarder',
      fileVaultOff: 'FileVault est désactivé : le disque n’est pas chiffré.',
      allGood: 'Rien à signaler.',
      ghNotAuthenticated: 'gh n’est pas connecté sur cette machine',
      repository: 'Dépôt',
      repositories: 'Dépôts',
      containerLogs: 'Logs du conteneur',
      exposedOnly: 'Exposés seulement',

      size: 'Taille',
      chipLabel: 'Puce',
      reviewRequests: 'Revues demandées',
      openPullRequests: 'Pull requests ouvertes',
      assignedIssues: 'Tickets assignés',
      notifications: 'Notifications',
      account: 'Compte',
      space: 'Espace',
      author: 'Auteur',
      spaces: 'Espaces',
      recentPages: 'Pages récentes',
      myContributions: 'Mes contributions',

      tabJira: 'Jira',
      jiraSynced: 'Synchronisé',
      jiraNotConfigured: 'Jira n’est pas configuré',
      jiraMissingHint: 'Renseigne ces variables puis relance l’app :',
      jiraAuthFailed: 'Jira a refusé les identifiants',
      jiraUnreachable: 'Jira est injoignable',
      jiraQueryFailed: 'La requête Jira a échoué',
      jiraOpenBoard: 'Ouvrir le board',
      jiraWorkload: 'File de travail',
      jiraFilterAll: 'Tous',
      jiraFilterMine: 'Mes tickets',
      jiraFilterBlocked: 'Bloqués',
      jiraFilterDue: 'Échéances',
      jiraTicket: 'Ticket',
      jiraSummary: 'Résumé',
      jiraStatus: 'Statut',
      jiraPriority: 'Priorité',
      jiraAssignee: 'Assigné',
      jiraDue: 'Échéance',
      jiraPoints: 'Pts',
      jiraDistribution: 'Répartition par statut',
      jiraByPriority: 'Charge par priorité',
      jiraWatch: 'À surveiller',
      jiraNothingToWatch: 'Rien de bloqué ni en retard',
      jiraMove: 'Déplacer ce ticket',
      jiraMoveTo: 'Passer en',
      jiraMoveDone: 'Ticket déplacé',
      jiraOverdue: 'En retard',
      jiraBlocked: 'Bloqués',
      jiraUnassigned: 'Non assignés',
      jiraDayLeft: 'j restants',
      jiraToday: 'aujourd’hui',
      jiraLate: 'en retard',
      jiraInDays: 'dans',
      jiraTicketLower: 'tickets',
      jiraDone: 'terminé',
      jiraSprint: 'Sprint',
      jiraProject: 'Projet',
      jiraNoIssues: 'Aucun ticket ne correspond à ce filtre',
      jiraSearch: 'Filtrer par clé ou titre…',
      statusTodo: 'À faire',
      statusProgress: 'En cours',
      statusReview: 'En revue',
      statusDone: 'Terminé',
      jiraBlockedOne: 'bloqué',
      jiraBlockedBadge: 'bloqués',
      jiraTokenSources: 'Identifiants essayés',
      close: 'Fermer',
      loading: 'Chargement…',
      working: 'En cours…',
      reporter: 'Rapporteur',
      labels: 'Étiquettes',
      epic: 'Epic',
      subtasks: 'Sous-tâches',
      description: 'Description',
      noDescription: 'Pas de description',
      activity: 'Activité',
      jiraOpen: 'Ouvrir dans Jira',
      readOnly: 'Lecture seule : rien ici ne modifie votre système.',
    };

    /* ---------------------------------------------------------- formatting */

    let idSeed = 0;
    const nextId = () => `dsm-${(idSeed += 1)}`;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const finite = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

    /** Bytes → "1,4 Go" style, using the UI's own language. */
    function makeByteFormatter(language) {
      const units = ['o', 'Ko', 'Mo', 'Go', 'To', 'Po'];
      const englishUnits = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      const table = /^fr/.test(language) ? units : englishUnits;
      return (bytes, digits = 1) => {
        const value = finite(Number(bytes), 0);
        if (value < 1) return `0 ${table[0]}`;
        const exponent = clamp(Math.floor(Math.log(value) / Math.log(1024)), 0, table.length - 1);
        const scaled = value / 1024 ** exponent;
        const shown = scaled >= 100 || exponent === 0 ? scaled.toFixed(0) : scaled.toFixed(digits);
        return `${shown.replace('.', /^fr/.test(language) ? ',' : '.')} ${table[exponent]}`;
      };
    }

    function formatUptime(seconds, t) {
      const total = Math.max(0, Math.floor(finite(seconds)));
      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      if (days > 0) return `${days} j ${hours} h`;
      if (hours > 0) return `${hours} h ${minutes} min`;
      return `${minutes} min`;
    }

    const formatPercent = (value) => `${finite(Number(value)).toFixed(1)}%`;
    /** "5 nov" — the short day form used by chips and the drawer. */
    const formatDay = (iso) => {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return '—';
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    };

    const formatClock = (timestamp) => {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return '—';
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    /* -------------------------------------------------------------- charts */

    /** Smooth cubic path through points for a soft, instrument-like curve. */
    function smoothPath(points) {
      if (points.length === 0) return '';
      if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
      const tension = 0.16;
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let index = 0; index < points.length - 1; index += 1) {
        const before = points[index - 1] ?? points[index];
        const start = points[index];
        const end = points[index + 1];
        const after = points[index + 2] ?? end;
        const c1x = start.x + (end.x - before.x) * tension;
        const c1y = start.y + (end.y - before.y) * tension;
        const c2x = end.x - (after.x - start.x) * tension;
        const c2y = end.y - (after.y - start.y) * tension;
        path += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${end.x} ${end.y}`;
      }
      return path;
    }

    /** Map a numeric series into the normalised 0..1000 × 0..100 chart space. */
    function toPoints(values, yMax, width = 1000, height = 100) {
      if (values.length === 0) return [];
      const denominator = Math.max(1, values.length - 1);
      return values.map((value, index) => ({
        x: values.length === 1 ? width / 2 : (index / denominator) * width,
        y: height - (clamp(finite(value), 0, yMax) / yMax) * height,
      }));
    }

    function Sparkline({ values, from, to, height = 44 }) {
      const gradientId = useMemo(nextId, []);
      const numeric = values.filter((value) => Number.isFinite(value));
      if (numeric.length < 2) {
        return h('div', { className: 'dsm-spark dsm-spark-empty', style: { height } });
      }
      // Auto-zoom with padding: a series that barely moves must not read as a
      // solid block, so the visible window expands around its own range.
      const lowest = Math.min(...numeric);
      const highest = Math.max(...numeric);
      const span = highest - lowest;
      const min = span < 1e-6 ? Math.max(0, lowest - 1) : Math.max(0, lowest - span * 0.45);
      const max = span < 1e-6 ? lowest + 1 : highest + span * 0.45;
      const range = max - min || 1;
      const denominator = Math.max(1, values.length - 1);
      const points = values.map((value, index) => ({
        x: (index / denominator) * 1000,
        y: 96 - (clamp(finite(value), min, max) - min) / range * 88,
      }));
      const line = smoothPath(points);
      const area = `${line} L 1000 100 L 0 100 Z`;
      return h(
        'svg',
        {
          className: 'dsm-spark',
          viewBox: '0 0 1000 100',
          preserveAspectRatio: 'none',
          style: { height },
          'aria-hidden': 'true',
        },
        h(
          'defs',
          null,
          h(
            'linearGradient',
            { id: gradientId, x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', stopColor: from, stopOpacity: '0.38' }),
            h('stop', { offset: '100%', stopColor: to, stopOpacity: '0' }),
          ),
        ),
        span < 1e-6 ? null : h('path', { d: area, fill: `url(#${gradientId})`, stroke: 'none' }),
        h('path', {
          d: line,
          fill: 'none',
          stroke: to,
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          vectorEffect: 'non-scaling-stroke',
        }),
      );
    }

    function Donut({ value, size = 84, stroke = 9, from, to, caption }) {
      const gradientId = useMemo(nextId, []);
      const radius = (size - stroke) / 2;
      const circumference = 2 * Math.PI * radius;
      const ratio = clamp(finite(value), 0, 100) / 100;
      return h(
        'div',
        { className: 'dsm-donut', style: { width: size, height: size } },
        h(
          'svg',
          { viewBox: `0 0 ${size} ${size}`, width: size, height: size, 'aria-hidden': 'true' },
          h(
            'defs',
            null,
            h(
              'linearGradient',
              { id: gradientId, x1: '0', y1: '0', x2: '1', y2: '1' },
              h('stop', { offset: '0%', stopColor: from }),
              h('stop', { offset: '100%', stopColor: to }),
            ),
          ),
          h('circle', {
            cx: size / 2,
            cy: size / 2,
            r: radius,
            fill: 'none',
            stroke: 'var(--dsm-track)',
            strokeWidth: stroke,
          }),
          h('circle', {
            cx: size / 2,
            cy: size / 2,
            r: radius,
            fill: 'none',
            stroke: `url(#${gradientId})`,
            strokeWidth: stroke,
            strokeLinecap: 'round',
            strokeDasharray: `${circumference * ratio} ${circumference}`,
            transform: `rotate(-90 ${size / 2} ${size / 2})`,
            style: { transition: 'stroke-dasharray 700ms cubic-bezier(.22,1,.36,1)' },
          }),
        ),
        caption
          ? h(
              'span',
              { className: 'dsm-donut-caption' },
              h('strong', null, formatPercent(value)),
              h('small', null, caption),
            )
          : null,
      );
    }

    /** Thin proportional bar, used for per-core load and container CPU. */
    function Meter({ value, from, to, height = 4 }) {
      const ratio = clamp(finite(value), 0, 100);
      return h(
        'span',
        { className: 'dsm-meter', style: { height } },
        h('span', {
          className: 'dsm-meter-fill',
          style: { width: `${ratio}%`, background: `linear-gradient(90deg, ${from}, ${to})` },
        }),
      );
    }

    /** Stacked segments for a memory breakdown that sums to the total. */
    function StackedBar({ segments }) {
      return h(
        'div',
        { className: 'dsm-stacked' },
        segments.map((segment) =>
          h('span', {
            key: segment.key,
            className: 'dsm-stacked-part',
            title: `${segment.label} · ${segment.display}`,
            style: { width: `${Math.max(0, segment.percent)}%`, background: segment.color },
          }),
        ),
      );
    }

    /* ---------------------------------------------------------- area chart */

    function AreaChart({ samples, series, yMax, formatValue, t }) {
      const [hoverIndex, setHoverIndex] = useState(null);
      const gradientIds = useMemo(() => series.map(nextId), [series.length]);
      const values = samples.length;
      const peak = Math.max(yMax ?? 0, ...series.flatMap((entry) => entry.values), 1);

      const handleMove = useCallback(
        (event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (bounds.width <= 0 || values === 0) return;
          const ratio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
          setHoverIndex(Math.round(ratio * (values - 1)));
        },
        [values],
      );

      if (values < 2) {
        return h(
          'div',
          { className: 'dsm-chart dsm-chart-empty' },
          h('span', { className: 'dsm-pulse' }),
          h('p', null, t('collecting')),
        );
      }

      const lines = series.map((entry) => {
        const points = toPoints(entry.values, peak);
        return { smooth: smoothPath(points), points, entry };
      });

      const hovered = hoverIndex === null ? null : clamp(hoverIndex, 0, values - 1);
      const hoverRatio = hovered === null ? 0 : hovered / Math.max(1, values - 1);
      const hoverSample = hovered === null ? null : samples[hovered];

      return h(
        'div',
        { className: 'dsm-chart-wrap' },
        h(
          'div',
          {
            className: 'dsm-chart',
            onPointerMove: handleMove,
            onPointerLeave: () => setHoverIndex(null),
            role: 'img',
            'aria-label': t('chartTitle'),
          },
          h(
            'svg',
            {
              className: 'dsm-chart-svg',
              viewBox: '0 0 1000 100',
              preserveAspectRatio: 'none',
              'aria-hidden': 'true',
            },
            h(
              'defs',
              null,
              ...series.map((entry, index) =>
                h(
                  'linearGradient',
                  { key: entry.key, id: gradientIds[index], x1: '0', y1: '0', x2: '0', y2: '1' },
                  h('stop', { offset: '0%', stopColor: entry.from, stopOpacity: '0.34' }),
                  h('stop', { offset: '70%', stopColor: entry.to, stopOpacity: '0.05' }),
                  h('stop', { offset: '100%', stopColor: entry.to, stopOpacity: '0' }),
                ),
              ),
            ),
            ...[0.25, 0.5, 0.75].map((ratio) =>
              h('line', {
                key: `grid-${ratio}`,
                x1: '0',
                y1: String(ratio * 100),
                x2: '1000',
                y2: String(ratio * 100),
                stroke: 'var(--dsm-grid)',
                strokeWidth: '1',
                vectorEffect: 'non-scaling-stroke',
              }),
            ),
            ...lines.map((line, index) =>
              h('path', {
                key: `area-${series[index].key}`,
                d: `${line.smooth} L 1000 100 L 0 100 Z`,
                fill: `url(#${gradientIds[index]})`,
                stroke: 'none',
              }),
            ),
            ...lines.map((line, index) =>
              h('path', {
                key: `line-${series[index].key}`,
                d: line.smooth,
                fill: 'none',
                stroke: series[index].to,
                strokeWidth: '2',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                vectorEffect: 'non-scaling-stroke',
              }),
            ),
          ),
          h('span', {
            className: 'dsm-now-dot',
            style: {
              top: `calc(${100 - (clamp(series[0].values[series[0].values.length - 1] ?? 0, 0, Math.max(peak, 1)) / Math.max(peak, 1)) * 100}% - 4px)`,
              background: series[0].to,
            },
            'aria-hidden': 'true',
          }),
          hovered === null
            ? null
            : h('div', {
                className: 'dsm-crosshair',
                style: { left: `${hoverRatio * 100}%` },
                'aria-hidden': 'true',
              }),
          hovered === null
            ? null
            : h(
                'div',
                {
                  className: `dsm-tooltip${hoverRatio > 0.62 ? ' dsm-tooltip-left' : ''}`,
                  style: { left: `${hoverRatio * 100}%` },
                },
                h('span', { className: 'dsm-tooltip-time' }, formatClock(hoverSample?.t)),
                ...series.map((entry) =>
                  h(
                    'span',
                    { key: entry.key, className: 'dsm-tooltip-row' },
                    h('i', { style: { background: entry.to } }),
                    h('em', null, entry.label),
                    h('b', null, formatValue(entry.values[hovered] ?? 0)),
                  ),
                ),
              ),
        ),
        h(
          'div',
          { className: 'dsm-axis' },
          ...series.map((entry) =>
            h(
              'div',
              { key: entry.key, className: 'dsm-axis-row' },
              h('span', { className: 'dsm-axis-k' }, entry.label),
              h('span', { className: 'dsm-axis-v' }, formatValue(entry.values[entry.values.length - 1] ?? 0)),
              h(
                'span',
                { className: 'dsm-axis-stats' },
                h('small', null, t('min')),
                h('b', null, formatValue(Math.min(...entry.values))),
                h('small', null, t('avg')),
                h('b', null, formatValue(entry.values.reduce((sum, value) => sum + value, 0) / Math.max(1, entry.values.length))),
                h('small', null, t('max')),
                h('b', null, formatValue(Math.max(...entry.values))),
              ),
            ),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------- widgets */

    function Pill({ tone = 'idle', children }) {
      return h('span', { className: `dsm-pill dsm-pill-${tone}` }, h('i', null), children);
    }

    function VitalCard({ accent, label, badge, value, unit, hint, side, stack }) {
      return h(
        'article',
        {
          className: 'dsm-card dsm-vital',
          style: { '--a1': accent[0], '--a2': accent[1] },
        },
        h(
          'header',
          { className: 'dsm-card-head' },
          h('span', { className: 'dsm-glow-dot' }),
          h('h3', null, label),
          badge ? h('span', { className: 'dsm-badge' }, badge) : null,
        ),
        h(
          'div',
          { className: 'dsm-vital-body' },
          h(
            'div',
            { className: 'dsm-vital-figure' },
            h('div', { className: 'dsm-value' }, value, unit ? h('span', { className: 'dsm-unit' }, unit) : null),
            hint ? h('p', { className: 'dsm-hint' }, hint) : null,
          ),
          side ?? null,
        ),
        stack && stack.length > 0 ? h('div', { className: 'dsm-vital-stack' }, ...stack) : null,
      );
    }

    /** Compact label/value tile used across the infrastructure panels. */
    function Stat({ label, value, tone }) {
      return h(
        'div',
        { className: `dsm-stat${tone ? ` dsm-stat-${tone}` : ''}` },
        h('span', { className: 'dsm-stat-k' }, label),
        h('strong', { className: 'dsm-stat-v' }, value),
      );
    }

    /** 12px control glyphs; unicode arrows render inconsistently across fonts. */
    const ICONS = {
      restart: h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'M13 8a5 5 0 1 1-1.46-3.54M13 2.6V6H9.6',
          stroke: 'currentColor',
          strokeWidth: '1.7',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      ),
      stop: h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true' },
        h('rect', { x: '4', y: '4', width: '8', height: '8', rx: '2.4', fill: 'currentColor' }),
      ),
      play: h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true' },
        h('path', { d: 'M5.6 3.7v8.6l6.4-4.3z', fill: 'currentColor' }),
      ),
      logs: h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M4 2.5h8v11H4z', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round' }),
        h('path', { d: 'M6 6h4M6 8.4h4M6 10.8h2.6', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
      ),
    };

    /**
     * One control. A destructive action arms on the first click and runs on the
     * second within four seconds, so nothing irreversible happens on a stray click.
     */
    function ActionButton({ icon, text, label, confirmLabel, tone = 'neutral', busy, disabled, onRun }) {
      const [armed, setArmed] = useState(false);
      useEffect(() => {
        if (!armed) return undefined;
        const timer = setTimeout(() => setArmed(false), 4000);
        return () => clearTimeout(timer);
      }, [armed]);
      return h(
        'button',
        {
          type: 'button',
          className: `dsm-act dsm-act-${tone}${armed ? ' dsm-act-armed' : ''}${text ? ' dsm-act-wide' : ''}`,
          title: armed ? confirmLabel : label,
          'aria-label': armed ? confirmLabel : label,
          'aria-disabled': disabled || busy ? 'true' : undefined,
          disabled: Boolean(disabled || busy),
          onClick: () => {
            if (disabled || busy) return;
            if (armed) {
              setArmed(false);
              onRun();
              return;
            }
            setArmed(true);
          },
        },
        busy
          ? h('span', { className: 'dsm-spin' })
          : armed
            ? h('span', { className: 'dsm-act-text' }, confirmLabel)
            : text
              ? h('span', { className: 'dsm-act-text' }, text)
              : h('span', { className: 'dsm-act-glyph', 'aria-hidden': 'true' }, ICONS[icon] ?? ICONS.restart),
      );
    }

    /** Running / pending / failed proportions of a pod set. */
    function PhaseBar({ pods, t }) {
      const total = Math.max(1, pods.total || 0);
      const parts = [
        { key: 'running', value: pods.running, color: '#10b981' },
        { key: 'succeeded', value: pods.succeeded, color: '#38bdf8' },
        { key: 'pending', value: pods.pending, color: '#f59e0b' },
        { key: 'failed', value: pods.failed, color: '#ef4444' },
      ].filter((part) => part.value > 0);
      return h(
        'div',
        { className: 'dsm-phases' },
        h(
          'div',
          { className: 'dsm-phase-bar' },
          ...parts.map((part) =>
            h('span', {
              key: part.key,
              style: { width: `${(part.value / total) * 100}%`, background: part.color },
            }),
          ),
        ),
        h(
          'div',
          { className: 'dsm-phase-legend' },
          ...parts.map((part) =>
            h(
              'span',
              { key: part.key, className: 'dsm-phase-item' },
              h('i', { style: { background: part.color } }),
              `${pods[part.key] ?? 0} ${t(part.key)}`,
            ),
          ),
        ),
      );
    }

    /** Tab glyphs, 14px, drawn to the same weight as the sidebar icon. */
    const tabIcon = (...paths) =>
      h(
        'svg',
        { viewBox: '0 0 24 24', width: 14, height: 14, fill: 'none', 'aria-hidden': 'true' },
        ...paths.map((d, index) =>
          h('path', { key: index, d, stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        ),
      );

    const TABS = [
      { id: 'system', label: 'tabSystem', icon: tabIcon('M3 15a2.5 2.5 0 0 0 2.5 2.5h13A2.5 2.5 0 0 0 21 15V8.5A2.5 2.5 0 0 0 18.5 6h-13A2.5 2.5 0 0 0 3 8.5Z', 'M6 21h12M12 17.5V21') },
      { id: 'todos', label: 'tabTodos', icon: tabIcon('M4 6.5h16M4 12h16M4 17.5h10', 'm16.2 16.2 1.6 1.6 2.8-3') },
      { id: 'k8s', label: 'tabK8s', icon: tabIcon('M12 2.6 20.5 7l-.2 9.4L12 21.4 3.7 16.4 3.5 7Z', 'M12 8.2v7.6M8.4 10.3l7 3.2M15.5 10.3l-7 3.2') },
      { id: 'docker', label: 'tabDocker', icon: tabIcon('M3.5 12.5h15.2c0 4-2.6 6.5-6.8 6.5H8.3c-2.6 0-4.8-2.2-4.8-6.5Z', 'M7 12.4V9.6M10.6 12.4V9.6M14.2 12.4V9.6', 'M18.8 12.4c.6-1.6 1.8-2.3 2.7-2.4') },
      { id: 'processes', label: 'tabProcesses', icon: tabIcon('M4 18V9M9 18V5M14 18v-6M19 18V7') },
      { id: 'network', label: 'tabNetwork', icon: tabIcon('M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z', 'M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5Z') },
      { id: 'security', label: 'tabSecurity', icon: tabIcon('M12 2.8 19.5 6v6c0 4.4-3.1 7.7-7.5 9.2C7.6 19.7 4.5 16.4 4.5 12V6Z', 'm8.6 11.8 2.4 2.5 4.5-4.8') },
      { id: 'github', label: 'tabGithub', icon: tabIcon('M9 19.2c-4 1.2-4-2-5.6-2.4M15.4 21v-3.3c0-1 .1-1.4-.5-2 2.3-.3 4.6-1.1 4.6-5.1a4 4 0 0 0-1.1-2.8 3.7 3.7 0 0 0-.1-2.8s-.9-.3-3 1.1a10.4 10.4 0 0 0-5.4 0C7.8 4.7 6.9 5 6.9 5a3.7 3.7 0 0 0-.1 2.8A4 4 0 0 0 5.7 10.6c0 4 2.3 4.8 4.6 5.1-.5.5-.5 1-.5 2V21') },
      { id: 'confluence', label: 'tabConfluence', icon: tabIcon('M4.5 17.5c3-4.4 5.6-4.8 9-3l2.6 1.4', 'M19.5 6.5c-3 4.4-5.6 4.8-9 3L7.9 8.1') },
      { id: 'jira', label: 'tabJira', icon: tabIcon('M12 2.5 21 7l-9 4.5L3 7Z', 'm3 12 9 4.5L21 12', 'm3 17 9 4.5L21 17') },
      { id: 'project', label: 'tabProject', icon: tabIcon('M4 19V9M9.4 19V5M14.8 19v-7M20.2 19v-4') },
      { id: 'veille', label: 'tabVeille', icon: tabIcon('M4 5.5h16v11H13l-4 3v-3H4Z', 'M7.5 9h9M7.5 12h5.5') },
      { id: 'cyber', label: 'tabCyber', icon: tabIcon('M12 3 4.5 6v5.5c0 4.2 3 7.9 7.5 9.5 4.5-1.6 7.5-5.3 7.5-9.5V6Z', 'M12 8v4M12 15.2v.6') },
    ];

    /* ------------------------------------------------------------ veille */

    /** A source name is enough to colour a card that has no picture. */
    const SOURCE_TINT = {
      'Hacker News': ['#ff6600', '#f59e0b'],
      'dev.to': ['#0ea5e9', '#6366f1'],
      'Hugging Face': ['#fbbf24', '#f472b6'],
      TechCrunch: ['#10b981', '#22d3ee'],
      'CERT-FR': ['#ef4444', '#f97316'],
      BleepingComputer: ['#a78bfa', '#ec4899'],
    };

    function NewsCard({ item, t }) {
      const tint = SOURCE_TINT[item.source] ?? ['#6366f1', '#22d3ee'];
      return h(
        'a',
        {
          className: 'news-card',
          href: item.url || '#',
          target: '_blank',
          rel: 'noreferrer',
          title: item.title,
        },
        h(
          'div',
          {
            className: 'news-media',
            // A muted wash, not a saturated block: the picture should lead.
            style: {
              background: `linear-gradient(135deg, color-mix(in srgb, ${tint[0]} 30%, #0c1018), #0c1018)`,
            },
          },
          item.image
            ? h('img', {
                src: `${IMAGE_ROUTE}?url=${encodeURIComponent(item.image)}`,
                alt: '',
                loading: 'lazy',
                referrerPolicy: 'no-referrer',
                onError: (event) => {
                  event.currentTarget.style.display = 'none';
                },
              })
            : h('span', { className: 'news-initial' }, (item.source ?? '?').slice(0, 1)),
          h('span', { className: 'news-source' }, item.source),
        ),
        h(
          'div',
          { className: 'news-body' },
          h('span', { className: 'news-title' }, item.title),
          item.summary ? h('span', { className: 'news-summary' }, item.summary) : null,
          h(
            'span',
            { className: 'news-meta' },
            item.published ? h('span', null, hoursAgo(new Date(item.published).toISOString(), t) ?? '') : null,
            item.score ? h('span', null, `▲ ${item.score}`) : null,
            item.comments ? h('span', null, `💬 ${item.comments}`) : null,
            ...(item.tags ?? []).slice(0, 2).map((tag) => h('span', { key: tag, className: 'news-tag' }, tag)),
          ),
        ),
      );
    }

    function VeilleView({ news, t }) {
      const [source, setSource] = useState('all');
      const items = news?.tech ?? [];
      const sources = useMemo(() => {
        const counts = new Map();
        for (const item of items) counts.set(item.source, (counts.get(item.source) ?? 0) + 1);
        return [...counts.entries()].sort((left, right) => right[1] - left[1]);
      }, [items]);
      const visible = source === 'all' ? items : items.filter((item) => item.source === source);

      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('articles'), value: items.length, tone: 'progress' },
            { label: t('sources'), value: sources.length, tone: 'done' },
            { label: t('illustrated'), value: items.filter((item) => item.image).length, tone: 'review' },
            { label: t('alerts'), value: news?.alerts?.length ?? 0, tone: 'late' },
            { label: t('lastRefresh'), value: news?.asOf ? `${hoursAgo(new Date(news.asOf).toISOString(), t)}` : '—', tone: 'blocked', small: true },
            { label: t('nextRefresh'), value: '10 min', tone: 'todo', small: true },
          ],
        }),
        h(
          'div',
          { key: 'filters', className: 'jira-toolbar' },
          h(
            'div',
            { className: 'jira-filters', role: 'group' },
            ...[['all', t('jiraFilterAll')], ...sources.map(([name, count]) => [name, `${name} · ${count}`])].map(
              ([key, label]) =>
                h(
                  'button',
                  { key, type: 'button', className: source === key ? 'on' : '', 'aria-pressed': source === key, onClick: () => setSource(key) },
                  label,
                ),
            ),
          ),
        ),
        h(
          'section',
          { key: 'grid', className: 'news-grid' },
          ...visible.slice(0, 30).map((item) => h(NewsCard, { key: item.id, item, t })),
        ),
        visible.length === 0
          ? h(Panel, { key: 'empty', title: t('tabVeille') }, h('p', { className: 'dsm-empty' }, t('noData')))
          : null,
      ];
    }

    /* ------------------------------------------------------------- todos */

    /**
     * The to-do tab. The list lives in a JSON file on the Host; this view is a
     * thin client over the two routes, with an optimistic re-render.
     */
    function TodosView({ summary, t, initialTodos }) {
      // `initialTodos` lets a caller render a list before the first read
      // (offline previews); in the app the first effect loads it.
      const [state, setState] = useState({
        status: initialTodos ? 'ready' : 'loading',
        todos: initialTodos ?? [],
        error: null,
      });
      const [filter, setFilter] = useState('open');
      const [draft, setDraft] = useState('');
      const [due, setDue] = useState('');
      const [priority, setPriority] = useState('normal');
      const [busy, setBusy] = useState(false);
      const [target, setTarget] = useState(null);

      const load = useCallback(async () => {
        try {
          const response = await fetch(new URL(TODOS_ROUTE, document.baseURI), {
            headers: { accept: 'application/json' },
            cache: 'no-store',
          });
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.ok) throw new Error(payload?.message ?? `HTTP ${response.status}`);
          setState({ status: 'ready', todos: payload.todos, error: null });
          setTarget({ updatedAt: payload.summary.updatedAt, file: payload.file });
        } catch (error) {
          setState((previous) => ({
            status: previous.todos.length > 0 ? 'stale' : 'error',
            todos: previous.todos,
            error: error instanceof Error ? error.message : String(error),
          }));
        }
      }, []);

      // Refetch when the Host reports a newer list (another window, a hand edit).
      useEffect(() => {
        if (summary?.updatedAt === undefined) return;
        if (target !== null && target.updatedAt === summary.updatedAt) return;
        load();
      }, [summary?.updatedAt, target, load]);

      const mutate = useCallback(
        async (body) => {
          setBusy(true);
          try {
            const response = await fetch(new URL(TODOS_ROUTE, document.baseURI), {
              method: 'POST',
              headers: { 'content-type': 'application/json', accept: 'application/json' },
              body: JSON.stringify(body),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.ok) throw new Error(payload?.message ?? `HTTP ${response.status}`);
            setState({ status: 'ready', todos: payload.todos, error: null });
            setTarget({ updatedAt: payload.summary.updatedAt, file: payload.file });
          } catch (error) {
            setState((previous) => ({
              ...previous,
              error: error instanceof Error ? error.message : String(error),
            }));
          } finally {
            setBusy(false);
          }
        },
        [],
      );

      const add = (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (text.length === 0) return;
        mutate({ op: 'add', text, due: due || null, priority });
        setDraft('');
        setDue('');
        setPriority('normal');
      };

      const today = new Date().toISOString().slice(0, 10);
      const todos = state.todos ?? [];
      const visible = todos.filter((entry) => {
        if (filter === 'open') return !entry.done;
        if (filter === 'done') return entry.done;
        if (filter === 'today') return !entry.done && entry.due !== null && entry.due <= today;
        return true;
      });
      const weekAhead = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
      const counts = {
        open: todos.filter((entry) => !entry.done).length,
        done: todos.filter((entry) => entry.done).length,
        today: todos.filter((entry) => !entry.done && entry.due !== null && entry.due <= today).length,
        high: todos.filter((entry) => !entry.done && entry.priority === 'high').length,
        week: todos.filter((entry) => !entry.done && entry.due !== null && entry.due <= weekAhead).length,
      };

      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('todoOpen'), value: counts.open, tone: 'progress' },
            { label: t('todoToday'), value: counts.today, tone: 'late', color: counts.today > 0 ? '#f59e0b' : undefined },
            { label: t('todoDone'), value: counts.done, tone: 'done' },
            { label: t('todoHigh'), value: counts.high, tone: 'blocked' },
            { label: t('todoWeek'), value: counts.week, tone: 'review' },
            { label: t('jiraFilterAll'), value: todos.length, tone: 'todo' },
          ],
        }),
        h(
          'article',
          { key: 'add', className: 'dsm-card dsm-todo-add' },
          h(
            'form',
            { onSubmit: add, className: 'dsm-todo-form' },
            h('input', {
              className: 'dsm-todo-input',
              value: draft,
              placeholder: t('todoPlaceholder'),
              'aria-label': t('todoPlaceholder'),
              maxLength: 500,
              onChange: (event) => setDraft(event.target.value),
            }),
            h('input', {
              className: 'dsm-todo-date',
              type: 'date',
              value: due,
              'aria-label': t('jiraDue'),
              onChange: (event) => setDue(event.target.value),
            }),
            h(
              'select',
              {
                className: 'dsm-todo-prio',
                value: priority,
                'aria-label': t('jiraPriority'),
                onChange: (event) => setPriority(event.target.value),
              },
              h('option', { value: 'high' }, t('todoHigh')),
              h('option', { value: 'normal' }, t('todoNormal')),
              h('option', { value: 'low' }, t('todoLow')),
            ),
            h(
              'button',
              { type: 'submit', className: 'dsm-todo-submit', disabled: busy || draft.trim().length === 0 },
              t('todoAdd'),
            ),
          ),
        ),
        h(
          Panel,
          {
            key: 'list',
            title: t('tabTodos'),
            accent: ['#22d3ee', '#6366f1'],
            badge: visible.length,
            actions: h(
              'div',
              { className: 'jira-filters', role: 'group' },
              ...[
                ['open', t('todoFilterOpen')],
                ['today', t('todoFilterToday')],
                ['done', t('todoFilterDone')],
                ['all', t('jiraFilterAll')],
              ].map(([key, label]) =>
                h(
                  'button',
                  {
                    key,
                    type: 'button',
                    className: filter === key ? 'on' : '',
                    'aria-pressed': filter === key,
                    onClick: () => setFilter(key),
                  },
                  label,
                ),
              ),
            ),
          },
          state.error ? h('p', { className: 'dsm-empty jira-error' }, state.error) : null,
          state.status === 'loading'
            ? h('div', { className: 'dsm-loading' }, h('span', { className: 'dsm-pulse' }), h('span', null, t('collecting')))
            : visible.length === 0
              ? h('p', { className: 'dsm-empty' }, t('todoEmpty'))
              : h(
                  'div',
                  { className: 'dsm-todo-list' },
                  ...visible.map((entry) =>
                    h(
                      'div',
                      {
                        key: entry.id,
                        className: `dsm-todo${entry.done ? ' is-done' : ''}${entry.priority === 'high' ? ' is-high' : ''}`,
                      },
                      h('input', {
                        type: 'checkbox',
                        className: 'dsm-todo-check',
                        checked: entry.done,
                        'aria-label': entry.text,
                        disabled: busy,
                        onChange: () => mutate({ op: 'toggle', id: entry.id }),
                      }),
                      h(
                        'div',
                        { className: 'dsm-todo-body' },
                        h('span', { className: 'dsm-todo-text' }, entry.text),
                        h(
                          'span',
                          { className: 'dsm-todo-meta' },
                          entry.due
                            ? h(
                                'span',
                                {
                                  className: `dsm-todo-due${
                                    !entry.done && entry.due < today ? ' is-late' : !entry.done && entry.due === today ? ' is-today' : ''
                                  }`,
                                },
                                entry.due === today ? t('jiraToday') : formatDay(entry.due),
                              )
                            : null,
                          entry.priority !== 'normal'
                            ? h('span', { className: `dsm-todo-prio-tag is-${entry.priority}` }, t(entry.priority === 'high' ? 'todoHigh' : 'todoLow'))
                            : null,
                          h('span', { className: 'dsm-dim' }, hoursAgo(new Date(entry.createdAt).toISOString(), t) ?? ''),
                        ),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsm-act dsm-act-danger',
                          title: t('todoDelete'),
                          'aria-label': t('todoDelete'),
                          disabled: busy,
                          onClick: () => mutate({ op: 'delete', id: entry.id }),
                        },
                        h('span', { className: 'dsm-act-glyph', 'aria-hidden': 'true' }, '×'),
                      ),
                    ),
                  ),
                ),
          counts.done > 0
            ? h(
                'footer',
                { className: 'dsm-todo-foot' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'jira-btn',
                    disabled: busy,
                    onClick: () => mutate({ op: 'clearDone' }),
                  },
                  t('todoClearDone'),
                ),
              )
            : null,
        ),
      ];
    }

    /* ------------------------------------------------------------- cyber */

    const SEVERITY_TONE = { critical: 'blocked', high: 'late', moderate: 'review', medium: 'review', low: 'todo', info: 'todo' };
    const SEVERITY_COLOR = { critical: '#ef4444', high: '#f97316', moderate: '#f59e0b', medium: '#f59e0b', low: '#64748b', info: '#64748b' };

    function CyberView({ news, t }) {
      const cyber = news?.cyber ?? {};
      const alerts = cyber.certAlerts ?? [];
      const advisories = cyber.certAdvisories ?? [];
      const ghsa = cyber.advisories ?? [];
      const attacks = cyber.attacks ?? [];
      const critical = ghsa.filter((entry) => entry.severity === 'critical').length;

      const advisoryColumns = [
        { key: 'date', label: t('published'), render: (entry) => h('span', { className: 'dsm-dim' }, entry.published ? formatDay(new Date(entry.published).toISOString()) : '—') },
        {
          key: 'title',
          label: t('jiraSummary'),
          wide: true,
          render: (entry) => h('a', { className: 'jira-summary', href: entry.url, target: '_blank', rel: 'noreferrer', title: entry.title }, entry.title),
        },
      ];

      const ghsaColumns = [
        {
          key: 'sev',
          label: t('severity'),
          render: (entry) =>
            h(
              'span',
              { className: `jira-status jira-status-${SEVERITY_TONE[entry.severity] ?? 'todo'}` },
              entry.severity || '—',
            ),
        },
        { key: 'cve', label: 'CVE', render: (entry) => h('span', { className: 'jira-key' }, entry.cve || entry.ghsa) },
        {
          key: 'summary',
          label: t('jiraSummary'),
          wide: true,
          render: (entry) =>
            h(
              'a',
              { className: 'jira-summary', href: entry.url, target: '_blank', rel: 'noreferrer', title: entry.summary },
              entry.summary,
            ),
        },
        { key: 'pkg', label: t('package'), align: 'right', render: (entry) => h('span', { className: 'dsm-dim' }, entry.package || '—') },
        { key: 'cvss', label: 'CVSS', align: 'right', render: (entry) => (entry.cvss ? entry.cvss.toFixed(1) : '—') },
      ];

      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('certAlerts'), value: alerts.length, tone: 'blocked' },
            { label: t('certAdvisories'), value: advisories.length, tone: 'late' },
            { label: t('criticalCve'), value: critical, tone: 'review', color: critical > 0 ? '#ef4444' : undefined },
            { label: t('trackedCve'), value: ghsa.length, tone: 'progress' },
            { label: t('attackNews'), value: attacks.length, tone: 'todo' },
            { label: t('lastRefresh'), value: news?.asOf ? hoursAgo(new Date(news.asOf).toISOString(), t) : '—', tone: 'done', small: true },
          ],
        }),
        h(
          'section',
          { key: 'grid', className: 'jira-grid' },
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('certAlerts'), accent: ['#ef4444', '#f97316'], badge: alerts.length },
              h(DataTable, { t, rows: alerts, rowKey: (entry) => entry.id, columns: advisoryColumns }),
            ),
            h(
              Panel,
              { title: t('trackedCve'), accent: ['#a78bfa', '#6366f1'], badge: ghsa.length },
              h(DataTable, { t, rows: ghsa, rowKey: (entry) => entry.id, columns: ghsaColumns }),
            ),
          ),
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('certAdvisories'), accent: ['#f59e0b', '#f97316'], badge: advisories.length },
              h(DataTable, { t, rows: advisories.slice(0, 12), rowKey: (entry) => entry.id, columns: advisoryColumns }),
            ),
            h(
              Panel,
              { title: t('attackNews'), accent: ['#ec4899', '#a78bfa'], badge: attacks.length },
              h(
                'div',
                { className: 'dsm-subblock', style: { borderTop: 0, paddingTop: 0, gap: '10px' } },
                ...attacks.slice(0, 8).map((entry) =>
                  h(
                    'a',
                    { key: entry.id, className: 'news-row', href: entry.url, target: '_blank', rel: 'noreferrer' },
                    h('span', { className: 'news-row-title' }, entry.title),
                    h('span', { className: 'news-row-meta' }, hoursAgo(new Date(entry.published ?? Date.now()).toISOString(), t) ?? ''),
                  ),
                ),
              ),
            ),
          ),
        ),
      ];
    }

    /* --------------------------------------------------------- shared bits */

    /** Generic table used by every tab; columns declare their own renderer. */
    function DataTable({ columns, rows, empty, rowKey, t }) {
      if (!rows || rows.length === 0) return h('p', { className: 'dsm-empty' }, empty ?? t('noData'));
      return h(
        'div',
        { className: 'dsm-table-scroll' },
        h(
          'table',
          { className: 'jira-issues' },
          h(
            'thead',
            null,
            h(
              'tr',
              null,
              ...columns.map((column) =>
                h(
                  'th',
                  { key: column.key, style: column.align === 'right' ? { textAlign: 'right' } : undefined },
                  column.label,
                ),
              ),
            ),
          ),
          h(
            'tbody',
            null,
            ...rows.map((row, index) =>
              h(
                'tr',
                { key: rowKey ? rowKey(row) : index },
                ...columns.map((column) =>
                  h(
                    'td',
                    {
                      key: column.key,
                      className:
                        column.align === 'right' ? 'jira-points' : column.wide ? 'jira-summary-cell' : undefined,
                    },
                    column.render(row),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    /** Six flat KPI tiles, the same language as the Jira tab. */
    function StatGrid({ items }) {
      return h(
        'section',
        { className: 'jira-kpis' },
        ...items.map((item) =>
          h(
            'div',
            { key: item.label, className: `jira-kpi jira-kpi-${item.tone ?? 'todo'}` },
            h('span', null, item.label),
            h(
              'strong',
              { className: item.small ? 'jira-kpi-strong-sm' : undefined, style: item.color ? { color: item.color } : undefined },
              String(item.value),
            ),
            h('i', null),
          ),
        ),
      );
    }

    /** Shown while a section's first read is still in flight. */
    function LoadingPanel({ title, t, accent }) {
      return h(
        Panel,
        { title, accent: accent ?? ['#38bdf8', '#6366f1'] },
        h(
          'div',
          { className: 'dsm-loading' },
          h('span', { className: 'dsm-pulse' }),
          h('span', null, t('collecting')),
        ),
      );
    }

    /** Shown when a section failed, with the reason the Host reported. */
    function ErrorPanel({ title, t, message, accent }) {
      return h(
        Panel,
        { title, accent: accent ?? ['#ef4444', '#f97316'] },
        h('p', { className: 'dsm-empty jira-error' }, message || t('unavailable')),
      );
    }

    /** A titled card, so every tab reads the same. */
    function Panel({ title, accent, badge, children, actions }) {
      return h(
        'article',
        { className: 'dsm-card dsm-table-card' },
        h(
          'header',
          { className: 'dsm-card-head' },
          h('span', { className: 'dsm-glow-dot', style: { '--a1': accent?.[0] ?? '#38bdf8', '--a2': accent?.[1] ?? '#6366f1' } }),
          h('h3', null, title),
          badge !== undefined && badge !== null ? h('span', { className: 'dsm-badge' }, String(badge)) : null,
          actions ? h('span', { className: 'dsm-head-spacer' }) : null,
          actions ?? null,
        ),
        children,
      );
    }

    /** Alerts already surfaced, so a refresh never replays the same one. */
    const alertMemory = { ready: false, seen: new Set() };

    const MONO = (value) => h('span', { className: 'jira-key' }, String(value ?? ''));

    /** Green when good, red when bad, neutral when unknown. */
    function flagTone(value) {
      return value === 'on' ? 'ok' : value === 'off' ? 'bad' : 'idle';
    }

    /* ---------------------------------------------------------- kubernetes */

    function KubernetesView({ k8s, t, formatBytes, runControl, pending }) {
      const [nsFilter, setNsFilter] = useState('all');
      const [podQuery, setPodQuery] = useState('');
      if (!k8s?.available) return h(Panel, { title: t('kubernetes'), children: h('p', { className: 'dsm-empty' }, t('notInstalled')) });
      if (!k8s.connected) {
        return h(
          Panel,
          { title: t('kubernetes'), accent: ['#818cf8', '#6366f1'] },
          h('p', { className: 'dsm-empty jira-error' }, k8s.error ?? t('disconnected')),
        );
      }
      const counts = k8s.pods ?? {};
      const deployed = k8s.deployments ?? {};
      return [
        h(
          'div',
          { key: 'ctx', className: 'dsm-context-row' },
          h('span', { className: 'dsm-context-label' }, t('context')),
          h(
            'select',
            {
              className: 'dsm-select',
              value: k8s.context ?? '',
              onChange: (event) =>
                runControl('kube.context', event.target.value, `${t('switchContext')} → ${event.target.value}`),
            },
            ...(k8s.contexts ?? []).map((name) => h('option', { key: name, value: name }, name)),
          ),
          h('span', { className: 'dsm-badge' }, k8s.serverVersion ?? ''),
        ),
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('nodePlural'), value: `${k8s.nodesReady ?? 0}/${k8s.nodesTotal ?? 0}`, tone: 'done' },
            { label: t('pods'), value: `${counts.running ?? 0}/${counts.total ?? 0}`, tone: 'progress' },
            { label: t('deployments'), value: deployed.active ?? 0, tone: 'review' },
            { label: t('restarts'), value: counts.restarts ?? 0, tone: 'late' },
            { label: t('degraded'), value: deployed.degraded ?? 0, tone: 'blocked' },
            { label: t('namespaces'), value: k8s.namespaces ?? 0, tone: 'todo' },
          ],
        }),
        h(
          'section',
          { key: 'grid', className: 'jira-grid' },
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('pods'), accent: ['#818cf8', '#6366f1'], badge: (k8s.podRows ?? []).length },
              h(
                'div',
                { className: 'jira-toolbar' },
                h(
                  'div',
                  { className: 'jira-filters', role: 'group' },
                  ...[
                    ['all', t('jiraFilterAll')],
                    ...Object.entries(
                      (k8s.podRows ?? []).reduce((acc, pod) => {
                        acc[pod.namespace] = (acc[pod.namespace] ?? 0) + 1;
                        return acc;
                      }, {}),
                    )
                      .sort((left, right) => right[1] - left[1])
                      .slice(0, 5)
                      .map(([namespace]) => [namespace, namespace]),
                  ].map(([key, label]) =>
                    h(
                      'button',
                      {
                        key,
                        type: 'button',
                        className: nsFilter === key ? 'on' : '',
                        'aria-pressed': nsFilter === key,
                        onClick: () => setNsFilter(key),
                      },
                      label,
                    ),
                  ),
                ),
                h(
                  'label',
                  { className: 'jira-search' },
                  h('input', {
                    value: podQuery,
                    placeholder: t('jiraSearch'),
                    'aria-label': t('jiraSearch'),
                    onChange: (event) => setPodQuery(event.target.value),
                    style: { border: 0, background: 'transparent', color: 'inherit', font: 'inherit', outline: 'none', width: '110px' },
                  }),
                ),
              ),
              h(DataTable, {
                t,
                rows: (k8s.podRows ?? []).filter(
                  (pod) =>
                    (nsFilter === 'all' || pod.namespace === nsFilter) &&
                    (podQuery.trim() === '' || pod.name.toLowerCase().includes(podQuery.trim().toLowerCase())),
                ),
                rowKey: (pod) => `${pod.namespace}/${pod.name}`,
                empty: t('noData'),
                columns: [
                  { key: 'ns', label: t('namespace'), render: (pod) => h('span', { className: 'dsm-dim' }, pod.namespace) },
                  {
                    key: 'name',
                    label: t('jiraSummary'),
                    wide: true,
                    render: (pod) => h('span', { className: 'jira-summary', title: pod.name }, pod.name),
                  },
                  {
                    key: 'phase',
                    label: t('jiraStatus'),
                    render: (pod) =>
                      h(
                        'span',
                        {
                          className: `jira-status jira-status-${
                            pod.phase === 'Running' ? 'done' : pod.phase === 'Succeeded' ? 'progress' : pod.phase === 'Failed' ? 'blocked' : 'todo'
                          }`,
                        },
                        pod.waiting ?? pod.phase,
                      ),
                  },
                  { key: 'ready', label: t('ready'), align: 'right', render: (pod) => `${pod.ready}/${pod.containers}` },
                  { key: 'restarts', label: '↻', align: 'right', render: (pod) => String(pod.restarts) },
                  { key: 'age', label: t('age'), align: 'right', render: (pod) => hoursAgo(pod.age, t) ?? '—' },
                  {
                    key: 'act',
                    label: '',
                    align: 'right',
                    render: (pod) =>
                      h(ActionButton, {
                        icon: 'stop',
                        tone: 'danger',
                        label: `${t('deletePod')} ${pod.name}`,
                        confirmLabel: t('confirm'),
                        disabled: pending !== null,
                        onRun: () => runControl('kube.deletePod', `${pod.namespace}/${pod.name}`, `${t('deletePod')} ${pod.name}`),
                      }),
                  },
                ],
              }),
            ),
            h(
              Panel,
              { title: t('nodePlural'), accent: ['#6366f1', '#818cf8'], badge: k8s.nodesTotal ?? 0 },
              h(DataTable, {
                t,
                rows: k8s.nodes ?? [],
                rowKey: (node) => node.name,
                columns: [
                  { key: 'name', label: t('node'), render: (node) => MONO(node.name) },
                  {
                    key: 'state',
                    label: t('jiraStatus'),
                    render: (node) => h('span', { className: `jira-status jira-status-${node.ready ? 'done' : 'blocked'}` }, node.ready ? t('ready') : t('notReady')),
                  },
                  { key: 'cpu', label: 'vCPU', align: 'right', render: (node) => String(node.cpu ?? '—') },
                  { key: 'mem', label: t('capacity'), align: 'right', render: (node) => formatBytes(node.memory ?? 0) },
                  { key: 'ver', label: t('version'), align: 'right', render: (node) => node.version ?? '—' },
                ],
              }),
            ),
          ),
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('deployments'), accent: ['#a78bfa', '#6366f1'], badge: deployed.list?.length ?? 0 },
              h(DataTable, {
                t,
                rows: (deployed.list ?? []).slice(0, 20),
                rowKey: (entry) => entry.id,
                columns: [
                  {
                    key: 'name',
                    label: t('jiraSummary'),
                    wide: true,
                    render: (entry) =>
                      h(
                        'span',
                        null,
                        h('span', { className: 'jira-summary' }, entry.name),
                        h('span', { className: 'jira-epic' }, entry.namespace),
                      ),
                  },
                  {
                    key: 'ready',
                    label: t('ready'),
                    align: 'right',
                    render: (entry) =>
                      h(
                        'span',
                        { className: `jira-ratio${entry.ready < entry.desired ? ' jira-ratio-bad' : ''}` },
                        `${entry.ready}/${entry.desired}`,
                      ),
                  },
                  {
                    key: 'act',
                    label: '',
                    align: 'right',
                    render: (entry) =>
                      h(ActionButton, {
                        icon: 'restart',
                        label: `${t('rolloutRestart')} ${entry.name}`,
                        confirmLabel: t('confirm'),
                        disabled: pending !== null,
                        onRun: () => runControl('kube.restart', entry.id, `${t('rolloutRestart')} ${entry.name}`),
                      }),
                  },
                ],
              }),
            ),
            h(
              Panel,
              { title: t('jiraByPriority'), accent: ['#f59e0b', '#f97316'], badge: (k8s.namespaceRequests ?? []).length },
              h(
                'div',
                { className: 'jira-prios' },
                ...(k8s.namespaceRequests ?? []).slice(0, 8).map((entry) =>
                  h(
                    'div',
                    { key: entry.namespace, className: 'jira-prio-row', style: { gridTemplateColumns: '110px minmax(0,1fr) 46px' } },
                    h('span', { className: 'jira-prio-label', title: entry.namespace }, entry.namespace),
                    h(
                      'span',
                      { className: 'jira-prio-track' },
                      h('i', {
                        style: {
                          width: `${Math.min(100, (entry.cpu / Math.max(0.1, k8s.namespaceRequests[0].cpu || 1)) * 100)}%`,
                          background: 'linear-gradient(90deg,#818cf8,#38bdf8)',
                        },
                      }),
                    ),
                    h('b', null, `${entry.cpu.toFixed(1)}`),
                  ),
                ),
              ),
            ),
            h(
              Panel,
              { title: t('recentWarnings'), accent: ['#ef4444', '#ec4899'], badge: (k8s.events ?? []).length },
              (k8s.events ?? []).length === 0
                ? h('p', { className: 'dsm-empty' }, t('noWarnings'))
                : h(
                    'div',
                    { className: 'dsm-subblock', style: { borderTop: 0, paddingTop: 0 } },
                    ...(k8s.events ?? []).slice(0, 6).map((event, index) =>
                      h(
                        'div',
                        { key: `${event.object}-${index}`, className: 'dsm-event', title: event.message },
                        h('span', { className: 'dsm-event-reason' }, event.reason),
                        h('span', { className: 'dsm-event-object' }, event.object),
                        h('span', { className: 'dsm-event-count' }, `×${event.count}`),
                        h('span', { className: 'dsm-event-text' }, event.message),
                      ),
                    ),
                  ),
            ),
          ),
        ),
      ];
    }

    /** Container log drawer: the last lines Docker kept for one container. */
    function DockerLogDrawer({ name, log, onClose, t }) {
      useEffect(() => {
        if (!name) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, [name, onClose]);
      if (!name) return null;
      return h(
        'div',
        { className: 'jira-overlay', role: 'presentation' },
        h('div', { className: 'jira-scrim', onClick: onClose, role: 'presentation' }),
        h(
          'aside',
          { className: 'jira-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': name },
          h(
            'div',
            { className: 'jira-drawer-head' },
            h(
              'div',
              { className: 'jira-drawer-crumb' },
              h('span', { className: 'jira-key' }, name),
              h(
                'button',
                { type: 'button', className: 'jira-drawer-close', onClick: onClose, 'aria-label': t('close') },
                '×',
              ),
            ),
            h('h2', { className: 'jira-drawer-title' }, t('containerLogs')),
            log?.status === 'loading'
              ? h('span', { className: 'jira-drawer-muted' }, t('loading'))
              : log?.status === 'error'
                ? h('span', { className: 'jira-drawer-muted jira-error' }, log.error)
                : null,
          ),
          h(
            'div',
            { className: 'jira-drawer-body' },
            h('pre', { className: 'dsm-log' }, log?.status === 'ready' ? log.text || t('noData') : ''),
          ),
          h(
            'div',
            { className: 'jira-drawer-foot' },
            h('button', { type: 'button', className: 'jira-btn jira-btn-ghost', onClick: onClose }, t('close')),
          ),
        ),
      );
    }

    /* -------------------------------------------------------------- docker */

    function DockerView({ docker, t, formatBytes, runControl, pending }) {
      const [logName, setLogName] = useState(null);
      const [log, setLog] = useState(null);
      const openLog = useCallback(async (name) => {
        setLogName(name);
        setLog({ status: 'loading' });
        try {
          const response = await fetch(
            new URL(`${DOCKER_LOG_ROUTE}?name=${encodeURIComponent(name)}&lines=200`, document.baseURI),
            { headers: { accept: 'application/json' }, cache: 'no-store' },
          );
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.ok) throw new Error(payload?.message ?? `HTTP ${response.status}`);
          setLog({ status: 'ready', text: payload.log.text });
        } catch (error) {
          setLog({ status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }, []);
      if (!docker?.available) return h(Panel, { title: t('docker'), children: h('p', { className: 'dsm-empty' }, t('notInstalled')) });
      const containers = docker.containers ?? [];
      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('running'), value: `${docker.summary?.running ?? 0}`, tone: 'done' },
            { label: t('stopped'), value: docker.summary?.stopped ?? 0, tone: 'todo' },
            { label: t('images'), value: (docker.images ?? []).length || docker.summary?.images || 0, tone: 'progress' },
            { label: t('volumes'), value: (docker.volumes ?? []).length, tone: 'review' },
            { label: t('totalCpu'), value: `${(docker.summary?.cpuTotal ?? 0).toFixed(0)}%`, tone: 'late' },
            { label: t('totalMemory'), value: formatBytes(docker.summary?.memUsed ?? 0), tone: 'blocked' },
          ],
        }),
        h(
          'section',
          { key: 'grid', className: 'jira-grid' },
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('containerTable'), accent: ['#38bdf8', '#0ea5e9'], badge: containers.length },
              h(DataTable, {
                t,
                rows: containers,
                rowKey: (container) => container.id || container.name,
                columns: [
                  {
                    key: 'name',
                    label: t('containerName'),
                    wide: true,
                    render: (container) =>
                      h(
                        'span',
                        null,
                        h('span', { className: 'jira-summary' }, container.name),
                        h('span', { className: 'jira-epic' }, container.image),
                      ),
                  },
                  {
                    key: 'state',
                    label: t('containerState'),
                    render: (container) =>
                      h(
                        'span',
                        { className: `jira-status jira-status-${container.state === 'running' ? 'done' : 'todo'}` },
                        container.state,
                      ),
                  },
                  { key: 'cpu', label: t('containerCpu'), align: 'right', render: (container) => (typeof container.cpu === 'number' ? `${container.cpu.toFixed(1)}%` : '—') },
                  { key: 'mem', label: t('containerMemory'), align: 'right', render: (container) => (container.memUsed ? formatBytes(container.memUsed) : '—') },
                  { key: 'pids', label: 'PIDs', align: 'right', render: (container) => (container.pids === null ? '—' : String(container.pids)) },
                  {
                    key: 'act',
                    label: '',
                    align: 'right',
                    render: (container) =>
                      h(
                        'div',
                        { className: 'dsm-act-row' },
                        h(ActionButton, {
                          icon: 'logs',
                          label: `${t('containerLogs')} · ${container.name}`,
                          confirmLabel: t('confirm'),
                          disabled: false,
                          onRun: () => openLog(container.name),
                        }),
                        h(ActionButton, {
                          icon: 'restart',
                          label: `${t('restart')} ${container.name}`,
                          confirmLabel: t('confirm'),
                          disabled: pending !== null,
                          onRun: () => runControl('docker.restart', container.name, `${t('restart')} ${container.name}`),
                        }),
                        container.state === 'running'
                          ? h(ActionButton, {
                              icon: 'stop',
                              tone: 'danger',
                              label: `${t('stop')} ${container.name}`,
                              confirmLabel: t('confirm'),
                              disabled: pending !== null,
                              onRun: () => runControl('docker.stop', container.name, `${t('stop')} ${container.name}`),
                            })
                          : h(ActionButton, {
                              icon: 'play',
                              tone: 'go',
                              label: `${t('start')} ${container.name}`,
                              confirmLabel: t('confirm'),
                              disabled: pending !== null,
                              onRun: () => runControl('docker.start', container.name, `${t('start')} ${container.name}`),
                            }),
                      ),
                  },
                ],
              }),
            ),
          ),
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('images'), accent: ['#0ea5e9', '#6366f1'], badge: (docker.images ?? []).length },
              h(DataTable, {
                t,
                rows: (docker.images ?? []).slice(0, 15),
                rowKey: (image) => `${image.repository}:${image.tag}:${image.id}`,
                columns: [
                  {
                    key: 'repo',
                    label: t('containerImage'),
                    wide: true,
                    render: (image) => h('span', { className: 'jira-summary', title: `${image.repository}:${image.tag}` }, `${image.repository}:${image.tag}`),
                  },
                  { key: 'size', label: t('size'), align: 'right', render: (image) => image.size },
                ],
              }),
            ),
            h(
              Panel,
              { title: t('volumes'), accent: ['#a78bfa', '#ec4899'], badge: (docker.volumes ?? []).length },
              h(DataTable, {
                t,
                rows: (docker.volumes ?? []).slice(0, 12),
                rowKey: (volume) => volume.name,
                columns: [
                  {
                    key: 'name',
                    label: t('volumes'),
                    wide: true,
                    render: (volume) =>
                      h(
                        'span',
                        null,
                        h('span', { className: 'jira-summary', title: volume.name }, volume.name),
                        h('span', { className: 'jira-epic' }, volume.driver),
                      ),
                  },
                ],
              }),
            ),
            h(
              Panel,
              { title: t('networks'), accent: ['#2dd4bf', '#14b8a6'], badge: (docker.networks ?? []).length },
              h(DataTable, {
                t,
                rows: docker.networks ?? [],
                rowKey: (network) => network.name,
                columns: [
                  { key: 'name', label: t('networks'), wide: true, render: (network) => h('span', { className: 'jira-summary' }, network.name) },
                  { key: 'driver', label: t('driver'), align: 'right', render: (network) => network.driver },
                ],
              }),
            ),
          ),
        ),
        h(DockerLogDrawer, { key: 'logs', name: logName, log, onClose: () => setLogName(null), t }),
      ];
    }

    /* ----------------------------------------------------------- processes */

    function ProcessesView({ system, t, formatBytes, runControl, pending }) {
      const [sortBy, setSortBy] = useState('cpu');
      const source = system.processes ?? [];
      const processes = useMemo(
        () => [...source].sort((left, right) => (sortBy === 'mem' ? (right.rss ?? 0) - (left.rss ?? 0) : right.cpu - left.cpu)),
        [source, sortBy],
      );
      if (processes.length === 0) {
        return h(Panel, { title: t('processesTable'), children: h('p', { className: 'dsm-empty' }, t('unavailable')) });
      }
      const heavy = processes.reduce((sum, entry) => sum + (entry.rss ?? 0), 0);
      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('processCount'), value: processes.length, tone: 'progress' },
            { label: t('cpu'), value: `${(system.cpu?.usage ?? 0).toFixed(0)}%`, tone: 'done' },
            { label: t('memory'), value: `${(system.memory?.percent ?? 0).toFixed(0)}%`, tone: 'late' },
            { label: t('residentMemory'), value: formatBytes(heavy), tone: 'review' },
            { label: t('loadLabel'), value: (system.cpu?.load?.[0] ?? 0).toFixed(2), tone: 'blocked' },
            { label: t('coresLabel'), value: system.cpu?.cores ?? 0, tone: 'todo' },
          ],
        }),
        h(
          Panel,
          {
            key: 'table',
            title: t('processesTable'),
            accent: ['#a78bfa', '#22d3ee'],
            badge: processes.length,
            actions: h(
              'div',
              { className: 'jira-filters', role: 'group' },
              ...[
                ['cpu', t('containerCpu')],
                ['mem', t('containerMemory')],
              ].map(([key, label]) =>
                h(
                  'button',
                  {
                    key,
                    type: 'button',
                    className: sortBy === key ? 'on' : '',
                    'aria-pressed': sortBy === key,
                    onClick: () => setSortBy(key),
                  },
                  label,
                ),
              ),
            ),
          },
          h(DataTable, {
            t,
            rows: processes,
            rowKey: (entry) => `${entry.pid}-${entry.name}`,
            columns: [
              { key: 'pid', label: 'PID', render: (entry) => MONO(entry.pid) },
              { key: 'name', label: t('processName'), wide: true, render: (entry) => h('span', { className: 'jira-summary', title: entry.name }, entry.name) },
              {
                key: 'cpu',
                label: t('containerCpu'),
                align: 'right',
                render: (entry) => h('b', { className: 'jira-ratio' }, `${entry.cpu.toFixed(1)}%`),
              },
              { key: 'mem', label: t('containerMemory'), align: 'right', render: (entry) => `${entry.mem.toFixed(1)}%` },
              { key: 'rss', label: 'RSS', align: 'right', render: (entry) => formatBytes(entry.rss ?? 0) },
              { key: 'elapsed', label: t('elapsed'), align: 'right', render: (entry) => entry.elapsed ?? '—' },
              {
                key: 'act',
                label: '',
                align: 'right',
                render: (entry) =>
                  h(ActionButton, {
                    icon: 'stop',
                    tone: 'danger',
                    label: `${t('killProcess')} ${entry.name}`,
                    confirmLabel: t('confirm'),
                    disabled: pending !== null || entry.pid <= 1,
                    onRun: () => runControl('process.kill', String(entry.pid), `${t('killProcess')} ${entry.name}`),
                  }),
              },
            ],
          }),
        ),
      ];
    }

    /* ------------------------------------------------------------- network */

    function NetworkView({ workspace, system, t, formatBytes }) {
      const [onlyExposed, setOnlyExposed] = useState(false);
      const ports = workspace?.ports ?? { available: false, ports: [] };
      const visiblePorts = (ports.ports ?? []).filter((entry) => !onlyExposed || entry.exposed);
      const net = system.net ?? {};
      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('listeningPorts'), value: ports.total ?? 0, tone: 'progress' },
            { label: t('exposedPorts'), value: ports.exposed ?? 0, tone: 'blocked' },
            { label: t('down'), value: `${formatBytes(net.rxRate ?? 0)}/s`, tone: 'done' },
            { label: t('up'), value: `${formatBytes(net.txRate ?? 0)}/s`, tone: 'review' },
            { label: t('receive'), value: formatBytes(net.rxTotal ?? 0), tone: 'late' },
            { label: t('transmit'), value: formatBytes(net.txTotal ?? 0), tone: 'todo' },
          ],
        }),
        h(
          'section',
          { key: 'grid', className: 'jira-grid' },
          h(
            Panel,
            {
              title: t('listeningPorts'),
              accent: ['#34d399', '#22d3ee'],
              badge: visiblePorts.length,
              actions: h(
                'div',
                { className: 'jira-filters', role: 'group' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: onlyExposed ? 'on' : '',
                    'aria-pressed': onlyExposed,
                    onClick: () => setOnlyExposed((value) => !value),
                  },
                  t('exposedOnly'),
                ),
              ),
            },
            h(DataTable, {
              t,
              rows: visiblePorts,
              rowKey: (entry) => entry.port,
              empty: t('noData'),
              columns: [
                {
                  key: 'port',
                  label: t('port'),
                  render: (entry) => h('b', { className: 'jira-key' }, `:${entry.port}`),
                },
                {
                  key: 'proc',
                  label: t('processName'),
                  wide: true,
                  render: (entry) =>
                    h(
                      'span',
                      null,
                      h('span', { className: 'jira-summary' }, entry.processes.map((one) => one.command).join(', ')),
                      h('span', { className: 'jira-epic' }, `pid ${entry.processes.map((one) => one.pid).join(', ')}`),
                    ),
                },
                { key: 'host', label: t('bind'), align: 'right', render: (entry) => entry.host },
                {
                  key: 'exposed',
                  label: '',
                  align: 'right',
                  render: (entry) =>
                    entry.exposed ? h('span', { className: 'jira-status jira-status-blocked' }, t('exposed')) : null,
                },
              ],
            }),
          ),
          h(
            Panel,
            { title: t('interfaces'), accent: ['#38bdf8', '#6366f1'], badge: (net.interfaces ?? []).length },
            h(
              'div',
              { className: 'jira-prios' },
              ...(net.interfaces ?? []).map((entry) =>
                h(
                  'div',
                  { key: entry.name, className: 'jira-prio-row', style: { gridTemplateColumns: '52px minmax(0,1fr) 84px' } },
                  h('span', { className: 'jira-prio-label' }, entry.name),
                  h('span', { className: 'jira-prio-track' },
                    h('i', {
                      style: {
                        width: `${Math.min(100, ((entry.rxRate + entry.txRate) / Math.max(1, net.interfaces[0].rxRate + net.interfaces[0].txRate || 1)) * 100)}%`,
                        background: 'linear-gradient(90deg,#34d399,#22d3ee)',
                      },
                    }),
                  ),
                  h('b', null, `${formatBytes(entry.rxRate + entry.txRate)}/s`),
                ),
              ),
            ),
          ),
        ),
      ];
    }

    /* ------------------------------------------------------------ security */

    function SecurityView({ workspace, meta, t }) {
      const security = workspace?.security ?? {};
      const flags = [
        ['FileVault', security.fileVault, t('diskEncryption')],
        ['Firewall', security.firewall, t('firewall')],
        ['SIP', security.sip, t('systemIntegrity')],
        ['Gatekeeper', security.gatekeeper, t('appNotarization')],
      ];
      return [
        h(
          'section',
          { key: 'flags', className: 'jira-kpis' },
          ...flags.map(([name, value, hint]) =>
            h(
              'div',
              { key: name, className: `jira-kpi jira-kpi-${flagTone(value)}`, style: { gridColumn: 'span 1' } },
              h('span', null, name),
              h('strong', { style: { fontSize: '18px' } }, value === 'on' ? t('enabled') : value === 'off' ? t('disabled') : '?'),
              h('i', null),
              h('span', { style: { marginTop: '6px', fontSize: '10px' } }, hint),
            ),
          ),
        ),
        h(
          'section',
          { key: 'grid', className: 'jira-grid' },
          h(
            Panel,
            { title: t('thisMachine'), accent: ['#6366f1', '#818cf8'] },
            h(
              'dl',
              { className: 'dsm-rows dsm-rows-cols' },
              ...[
                [t('hostname'), meta.computerName ?? meta.hostname ?? '—'],
                [t('os'), meta.osVersion ?? '—'],
                [t('chipLabel'), meta.chip ?? '—'],
                [t('coresLabel'), String(meta.cores ?? '—')],
                [t('memory'), meta.memoryTotal ? `${Math.round(meta.memoryTotal / 1024 ** 3)} Go` : '—'],
                [t('uptimeLabel'), `${Math.floor((meta.uptime ?? 0) / 86400)} j ${Math.floor(((meta.uptime ?? 0) % 86400) / 3600)} h`],
                [t('lastUpdate'), security.lastUpdate ?? '—'],
              ].map(([label, value]) =>
                h('div', { key: label, className: 'dsm-row' }, h('dt', null, label), h('dd', { title: String(value) }, value)),
              ),
            ),
          ),
          h(
            Panel,
            { title: t('reminders'), accent: ['#f59e0b', '#f97316'] },
            h(
              'div',
              { className: 'dsm-subblock', style: { borderTop: 0, paddingTop: 0 } },
              ...(security.fileVault === 'off'
                ? [h('p', { className: 'dsm-empty jira-error' }, t('fileVaultOff'))]
                : [h('p', { className: 'dsm-empty' }, t('allGood'))]),
            ),
          ),
        ),
      ];
    }

    /* -------------------------------------------------------------- github */

    function GithubView({ workspace, t }) {
      const github = workspace?.github ?? {};
      if (!github.available) {
        return h(
          Panel,
          { title: t('tabGithub') },
          h('p', { className: 'dsm-empty jira-error' }, github.reason === 'not-authenticated' ? t('ghNotAuthenticated') : t('unavailable')),
        );
      }
      const repos = new Set(
        [...(github.reviews ?? []), ...(github.pullRequests ?? []), ...(github.issues ?? [])].map(
          (entry) => entry.repo,
        ),
      ).size;
      const row = (entry) => ({
        key: `${entry.repo}#${entry.number}`,
        title: entry.title,
        repo: entry.repo,
        number: entry.number,
        updated: entry.updated,
        url: entry.url,
        draft: entry.draft,
        labels: entry.labels ?? [],
      });
      const prColumns = [
        { key: 'repo', label: t('repository'), render: (entry) => h('span', { className: 'dsm-dim' }, entry.repo) },
        {
          key: 'title',
          label: t('jiraSummary'),
          wide: true,
          render: (entry) =>
            h('span', { className: 'jira-summary', title: entry.title }, `#${entry.number} ${entry.title}`),
        },
        { key: 'age', label: t('updated'), align: 'right', render: (entry) => hoursAgo(entry.updated, t) ?? '—' },
      ];
      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('reviewRequests'), value: (github.reviews ?? []).length, tone: 'late' },
            { label: t('openPullRequests'), value: (github.pullRequests ?? []).length, tone: 'progress' },
            { label: t('assignedIssues'), value: (github.issues ?? []).length, tone: 'review' },
            { label: t('notifications'), value: github.unreadCount ?? 0, tone: 'blocked' },
            { label: t('repositories'), value: repos ?? 0, tone: 'done' },
            { label: t('account'), value: github.account ?? '—', tone: 'todo', small: true },
          ],
        }),
        h(
          'section',
          { key: 'grid', className: 'jira-grid' },
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('reviewRequests'), accent: ['#a78bfa', '#6366f1'], badge: (github.reviews ?? []).length },
              h(DataTable, { t, rows: (github.reviews ?? []).map(row), rowKey: (entry) => entry.key, columns: prColumns }),
            ),
            h(
              Panel,
              { title: t('openPullRequests'), accent: ['#38bdf8', '#0ea5e9'], badge: (github.pullRequests ?? []).length },
              h(DataTable, { t, rows: (github.pullRequests ?? []).map(row), rowKey: (entry) => entry.key, columns: prColumns }),
            ),
          ),
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('notifications'), accent: ['#ef4444', '#ec4899'], badge: github.unreadCount ?? 0 },
              h(DataTable, {
                t,
                rows: (github.notifications ?? []).slice(0, 15),
                rowKey: (entry) => entry.id,
                columns: [
                  {
                    key: 'title',
                    label: t('jiraSummary'),
                    wide: true,
                    render: (entry) =>
                      h(
                        'span',
                        null,
                        h('span', { className: 'jira-summary', title: entry.title }, entry.title),
                        h('span', { className: 'jira-epic' }, `${entry.repo} · ${entry.reason}`),
                      ),
                  },
                  { key: 'age', label: t('updated'), align: 'right', render: (entry) => hoursAgo(entry.updated, t) ?? '—' },
                ],
              }),
            ),
          ),
        ),
      ];
    }

    /* ---------------------------------------------------------- confluence */

    function ConfluenceView({ workspace, t }) {
      const confluence = workspace?.confluence ?? {};
      if (!confluence.available) {
        return h(
          Panel,
          { title: t('tabConfluence') },
          h('p', { className: 'dsm-empty jira-error' }, confluence.reason === 'missing-credentials' ? t('jiraNotConfigured') : t('unavailable')),
        );
      }
      const pageColumns = [
        { key: 'space', label: t('space'), render: (page) => h('span', { className: 'dsm-dim' }, page.spaceKey || page.space) },
        {
          key: 'title',
          label: t('jiraSummary'),
          wide: true,
          render: (page) =>
            h('a', { className: 'jira-summary', href: page.url, target: '_blank', rel: 'noreferrer', title: page.title }, page.title),
        },
        { key: 'by', label: t('author'), align: 'right', render: (page) => page.by || '—' },
        { key: 'when', label: t('updated'), align: 'right', render: (page) => hoursAgo(page.updated, t) ?? '—' },
      ];
      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('spaces'), value: confluence.spaceCount ?? 0, tone: 'progress' },
            { label: t('recentPages'), value: (confluence.recent ?? []).length, tone: 'done' },
            { label: t('myContributions'), value: (confluence.mine ?? []).length, tone: 'review' },
            { label: t('tabConfluence'), value: 'wiki', tone: 'todo' },
          ],
        }),
        h(
          'section',
          { key: 'grid', className: 'jira-grid' },
          h(
            Panel,
            { title: t('recentPages'), accent: ['#2684ff', '#0052cc'], badge: (confluence.recent ?? []).length },
            h(DataTable, { t, rows: (confluence.recent ?? []).slice(0, 15), rowKey: (page) => page.id, columns: pageColumns }),
          ),
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('myContributions'), accent: ['#38bdf8', '#6366f1'], badge: (confluence.mine ?? []).length },
              h(DataTable, { t, rows: (confluence.mine ?? []).slice(0, 10), rowKey: (page) => `m-${page.id}`, columns: pageColumns }),
            ),
            h(
              Panel,
              { title: t('spaces'), accent: ['#2dd4bf', '#14b8a6'], badge: confluence.spaceCount ?? 0 },
              h(DataTable, {
                t,
                rows: (confluence.spaces ?? []).slice(0, 12),
                rowKey: (space) => space.key,
                columns: [
                  { key: 'name', label: t('space'), wide: true, render: (space) => h('span', { className: 'jira-summary' }, space.name) },
                  { key: 'key', label: '', align: 'right', render: (space) => h('span', { className: 'dsm-dim' }, space.key) },
                ],
              }),
            ),
          ),
        ),
      ];
    }

    /** A labelled bar list, the shape every breakdown on the project tab uses. */
    function BarList({ items, color = 'linear-gradient(90deg,#2684ff,#6366f1)', t, cap = 10 }) {
      const rows = (items ?? []).slice(0, cap);
      if (rows.length === 0) return h('p', { className: 'dsm-empty' }, t('noData'));
      const peak = Math.max(1, ...rows.map((entry) => entry.value));
      return h(
        'div',
        { className: 'jira-prios' },
        ...rows.map((entry) =>
          h(
            'div',
            { key: entry.label, className: 'jira-prio-row', style: { gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) 34px' } },
            h('span', { className: 'jira-prio-label', title: entry.label }, entry.label),
            h('span', { className: 'jira-prio-track' }, h('i', { style: { width: `${(entry.value / peak) * 100}%`, background: color } })),
            h('b', null, String(entry.value)),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------- connect */

    /**
     * Project KPIs for the tracked Jira project.
     * Flow totals come from Jira counts; breakdowns from the loaded sample.
     */
    function ProjectView({ project, t }) {
      if (!project?.available) {
        return h(
          Panel,
          { title: t('tabProject'), accent: ['#2684ff', '#0052cc'] },
          h('p', { className: 'dsm-empty jira-error' }, t('jiraNotConfigured')),
        );
      }
      const counts = project.counts ?? {};
      const net = (counts.resolved7 ?? 0) - (counts.created7 ?? 0);
      return [
        h(StatGrid, {
          key: 'kpis',
          items: [
            { label: t('openIssues'), value: counts.open ?? 0, tone: 'todo' },
            { label: t('created7'), value: counts.created7 ?? 0, tone: 'progress' },
            { label: t('resolved7'), value: counts.resolved7 ?? 0, tone: 'done' },
            { label: t('netFlow'), value: `${net > 0 ? '+' : ''}${net}`, tone: net >= 0 ? 'done' : 'blocked', color: net >= 0 ? '#10b981' : '#ef4444' },
            { label: t('overdue'), value: counts.overdue ?? 0, tone: 'late' },
            { label: t('unassigned'), value: counts.unassigned ?? 0, tone: 'review' },
          ],
        }),
        h(
          'section',
          { key: 'grid', className: 'jira-grid' },
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('flow30'), accent: ['#2684ff', '#38bdf8'], badge: t('tabProject') },
              h(
                'div',
                { className: 'jira-prios' },
                ...[
                  [t('created7'), counts.created7 ?? 0, '#38bdf8'],
                  [t('resolved7'), counts.resolved7 ?? 0, '#10b981'],
                  [t('created30'), counts.created30 ?? 0, 'linear-gradient(90deg,#2684ff,#38bdf8)'],
                  [t('resolved30'), counts.resolved30 ?? 0, 'linear-gradient(90deg,#10b981,#2dd4bf)'],
                ].map(([label, value, color]) =>
                  h(
                    'div',
                    { key: label, className: 'jira-prio-row', style: { gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr) 40px' } },
                    h('span', { className: 'jira-prio-label' }, label),
                    h(
                      'span',
                      { className: 'jira-prio-track' },
                      h('i', {
                        style: {
                          width: `${Math.min(100, (value / Math.max(1, counts.created30 ?? 1)) * 100)}%`,
                          background: color,
                        },
                      }),
                    ),
                    h('b', null, String(value)),
                  ),
                ),
              ),
              h('p', { className: 'dsm-empty', style: { marginTop: '10px' } }, `${t('sample')} · ${project.sampleSize} ${t('jiraTicketLower')}`),
            ),
            h(
              Panel,
              { title: t('byAssignee'), accent: ['#6366f1', '#818cf8'], badge: project.byAssignee?.length ?? 0 },
              h(BarList, { items: project.byAssignee, t, color: 'linear-gradient(90deg,#6366f1,#a78bfa)' }),
            ),
            h(
              Panel,
              { title: t('byEpic'), accent: ['#a78bfa', '#ec4899'], badge: project.byEpic?.length ?? 0 },
              h(BarList, { items: project.byEpic, t, color: 'linear-gradient(90deg,#a78bfa,#f472b6)', cap: 8 }),
            ),
          ),
          h(
            'div',
            { className: 'jira-col' },
            h(
              Panel,
              { title: t('jiraDistribution'), accent: ['#38bdf8', '#6366f1'], badge: project.sampleSize ?? 0 },
              h(BarList, { items: project.byStatus, t, color: 'linear-gradient(90deg,#38bdf8,#6366f1)' }),
            ),
            h(
              Panel,
              { title: t('jiraByPriority'), accent: ['#f59e0b', '#f97316'], badge: project.byPriority?.length ?? 0 },
              h(BarList, { items: project.byPriority, t, color: 'linear-gradient(90deg,#f59e0b,#f97316)' }),
            ),
            h(
              Panel,
              { title: t('jiraProject'), accent: ['#0052cc', '#2684ff'] },
              h(
                'dl',
                { className: 'dsm-rows' },
                ...[
                  [t('jiraProject'), `${project.projectName} (${project.projectKey})`],
                  [t('openIssues'), String(counts.open ?? 0)],
                  [t('overdue'), String(counts.overdue ?? 0)],
                  [t('unassigned'), String(counts.unassigned ?? 0)],
                  [t('sync'), hoursAgo(new Date(project.asOf ?? Date.now()).toISOString(), t) ?? '—'],
                ].map(([label, value]) =>
                  h('div', { key: label, className: 'dsm-row' }, h('dt', null, label), h('dd', null, value)),
                ),
              ),
            ),
          ),
        ),
      ];
    }

    /* ----------------------------------------------------------------- jira */

    const JIRA_STATUS_TONE = { todo: 'todo', progress: 'progress', review: 'review', done: 'done' };

    /** "dans 2 j", "aujourd'hui", "en retard de 3 j" from a day delta. */
    function dueLabel(days, t, finished = false) {
      if (days === null || days === undefined) return null;
      // A finished ticket keeps its date as context, never as a red warning.
      if (finished) return { text: days < 0 ? `${t('jiraLate')} ${Math.abs(days)} j` : '', tone: '' };
      if (days === 0) return { text: t('jiraToday'), tone: 'late' };
      if (days > 0) return { text: `${t('jiraInDays')} ${days} j`, tone: days <= 2 ? 'soon' : '' };
      return { text: `${t('jiraLate')} ${Math.abs(days)} j`, tone: 'late' };
    }

    function hoursAgo(iso, t) {
      const stamp = Date.parse(iso ?? '');
      if (Number.isNaN(stamp)) return null;
      const minutes = Math.max(0, Math.round((Date.now() - stamp) / 60_000));
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `${hours} h`;
      return `${Math.round(hours / 24)} j`;
    }

    function JiraAvatar({ person }) {
      if (!person) {
        return h('span', { className: 'jira-av jira-av-empty', title: '—' }, '?');
      }
      return h('span', { className: 'jira-av', style: { '--av': person.color }, title: person.name }, person.initials);
    }

    /** The setup / failure card, shown instead of the board when Jira is out of reach. */
    function JiraSetup({ jira, t }) {
      const missing = jira?.missing ?? [];
      const reason = jira?.reason;
      const title =
        reason === 'auth-failed'
          ? t('jiraAuthFailed')
          : reason === 'unreachable'
            ? t('jiraUnreachable')
            : reason === 'query-failed'
              ? t('jiraQueryFailed')
              : t('jiraNotConfigured');
      return h(
        'section',
        { className: 'dsm-card jira-setup' },
        h(
          'header',
          { className: 'dsm-card-head' },
          h('span', { className: 'dsm-glow-dot', style: { '--a1': '#2684ff', '--a2': '#0052cc' } }),
          h('h3', null, title),
          h('span', { className: 'dsm-head-spacer' }),
          jira?.baseUrl ? h('span', { className: 'dsm-badge' }, jira.baseUrl.replace(/^https?:\/\//, '')) : null,
        ),
        jira?.error ? h('p', { className: 'dsm-empty jira-error' }, jira.error) : null,
        Array.isArray(jira?.tried) && jira.tried.length > 0
          ? h(
              'div',
              null,
              h('p', { className: 'dsm-empty' }, t('jiraTokenSources')),
              h(
                'ul',
                { className: 'jira-missing' },
                ...jira.tried.map((attempt) =>
                  h(
                    'li',
                    { key: attempt.source },
                    h('code', null, attempt.source),
                    h('span', null, `HTTP ${attempt.status}`),
                  ),
                ),
              ),
            )
          : null,
        h('p', { className: 'dsm-empty' }, t('jiraMissingHint')),
        h(
          'ul',
          { className: 'jira-missing' },
          ...(missing.length > 0 ? missing : ['JIRA_URL', 'JIRA_API_TOKEN']).map((name) =>
            h(
              'li',
              { key: name },
              h('code', null, name),
              h('span', null, name.startsWith('JIRA_URL') ? (jira?.baseUrl ?? 'https://<site>.atlassian.net') : name.startsWith('JIRA_EMAIL') ? (jira?.email ?? 'you@company.com') : '••••••••'),
            ),
          ),
        ),
      );
    }

    /**
     * The Jira tab: workload, status and priority breakdown, and the transition
     * control. Every number comes from the Host's last read; this view never
     * calls Jira itself.
     */
    function JiraView({ jira, t, runControl, pending, initialIssue }) {
      const [filter, setFilter] = useState('all');
      const [query, setQuery] = useState('');
      const [openKey, setOpenKey] = useState(null);
      const [transitions, setTransitions] = useState({});
      // `initialIssue` opens the drawer straight away, for a deep link or the
      // offline render harness; the detail may come pre-loaded with it.
      const [detailKey, setDetailKey] = useState(initialIssue?.key ?? null);
      const [detail, setDetail] = useState(initialIssue?.detail ?? null);

      const connected = jira?.configured === true && jira?.connected === true;
      const me = jira?.account?.name ?? '';
      const issues = Array.isArray(jira?.issues) ? jira.issues : [];

      const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return issues.filter((issue) => {
          if (needle && !`${issue.key} ${issue.summary}`.toLowerCase().includes(needle)) return false;
          if (filter === 'mine') return issue.assignee?.name === me;
          if (filter === 'blocked') return issue.blocked;
          if (filter === 'due') return issue.dueDays !== null && issue.dueDays <= 0;
          return true;
        });
      }, [issues, filter, query, me]);

      const openTransitions = useCallback(
        async (key) => {
          if (openKey === key) {
            setOpenKey(null);
            return;
          }
          setOpenKey(key);
          if (transitions[key]) return;
          try {
            const response = await fetch(
              new URL(`${TRANSITIONS_ROUTE}?key=${encodeURIComponent(key)}`, document.baseURI),
              { headers: { accept: 'application/json' }, cache: 'no-store' },
            );
            const payload = await response.json().catch(() => null);
            if (response.ok && payload?.ok) {
              setTransitions((previous) => ({ ...previous, [key]: payload.transitions }));
            } else {
              setTransitions((previous) => ({ ...previous, [key]: [] }));
            }
          } catch {
            setTransitions((previous) => ({ ...previous, [key]: [] }));
          }
        },
        [openKey, transitions],
      );

      /** Open the drawer and load the issue detail plus its transitions. */
      const openDetail = useCallback(
        async (key) => {
          setDetailKey(key);
          setDetail({ status: 'loading' });
          try {
            const response = await fetch(
              new URL(`${ISSUE_ROUTE}?key=${encodeURIComponent(key)}`, document.baseURI),
              { headers: { accept: 'application/json' }, cache: 'no-store' },
            );
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.ok) throw new Error(payload?.message ?? `HTTP ${response.status}`);
            setDetail({ status: 'ready', data: payload.issue });
          } catch (error) {
            setDetail({ status: 'error', error: error instanceof Error ? error.message : String(error) });
          }
          try {
            const response = await fetch(
              new URL(`${TRANSITIONS_ROUTE}?key=${encodeURIComponent(key)}`, document.baseURI),
              { headers: { accept: 'application/json' }, cache: 'no-store' },
            );
            const payload = await response.json().catch(() => null);
            if (response.ok && payload?.ok) {
              setTransitions((previous) => ({ ...previous, [key]: payload.transitions }));
            }
          } catch {
            /* the footer simply offers no transition */
          }
        },
        [],
      );

      const closeDetail = useCallback(() => setDetailKey(null), []);

      if (!connected) return h(JiraSetup, { jira, t });

      const counts = jira.counts ?? {};
      const total = counts.total ?? 0;
      const watched = issues
        .filter(
          (issue) =>
            issue.statusTone !== 'done' &&
            (issue.blocked || (issue.dueDays !== null && issue.dueDays <= 0)),
        )
        .sort((left, right) => (left.dueDays ?? 99) - (right.dueDays ?? 99))
        .slice(0, 6);
      const distribution = [
        { key: 'todo', label: t('statusTodo'), value: counts.todo ?? 0, color: '#64748b' },
        { key: 'progress', label: t('statusProgress'), value: counts.progress ?? 0, color: '#38bdf8' },
        { key: 'review', label: t('statusReview'), value: counts.review ?? 0, color: '#a78bfa' },
        { key: 'done', label: t('statusDone'), value: counts.done ?? 0, color: '#10b981' },
      ];
      const priorities = Array.isArray(jira.priorities) ? jira.priorities : [];
      const priorityPeak = Math.max(1, ...priorities.map((entry) => entry.value));
      const sprint = jira.sprint ?? null;
      const project = jira.project ?? null;
      const boardUrl = project ? `${jira.baseUrl}/browse/${project.key}` : jira.baseUrl;

      return [
        /* ------------------------------------------------ sprint line */
        h(
          'section',
          { key: 'jira-sprintline', className: 'jira-sprintline' },
          h(
            'span',
            { className: 'jira-sprintline-label' },
            h('b', null, String(counts.done ?? 0)),
            ` / ${total} ${t('jiraTicketLower')} ${t('jiraDone')}`,
          ),
          h(
            'span',
            { className: 'jira-sprintline-track' },
            h('i', { style: { width: `${jira.progress ?? 0}%` } }),
          ),
          h('span', { className: 'jira-sprintline-pct' }, `${jira.progress ?? 0} %`),
          h('span', { className: 'jira-sprintline-sep' }),
          h(
            'span',
            { className: 'jira-sprintline-fig' },
            h('em', null, t('jiraBlocked')),
            h('b', { style: { color: '#ef4444' } }, String(counts.blocked ?? 0)),
          ),
          h(
            'span',
            { className: 'jira-sprintline-fig' },
            h('em', null, t('jiraOverdue')),
            h('b', { style: { color: '#f59e0b' } }, String(counts.overdue ?? 0)),
          ),
          h(
            'span',
            { className: 'jira-sprintline-fig' },
            h('em', null, t('jiraUnassigned')),
            h('b', null, String(counts.unassigned ?? 0)),
          ),
          sprint && sprint.daysLeft !== null
            ? h(
                'span',
                { className: 'jira-sprintline-fig' },
                h('em', null, t('jiraSprint')),
                h('b', null, `${sprint.daysLeft} ${t('jiraDayLeft')}`),
              )
            : null,
          h(
            'a',
            { className: 'jira-open', href: boardUrl, target: '_blank', rel: 'noreferrer' },
            t('jiraOpenBoard'),
          ),
        ),

        /* ------------------------------------------------------- kpis */
        h(
          'section',
          { key: 'jira-kpis', className: 'jira-kpis' },
          ...[
            ['todo', t('statusTodo'), counts.todo ?? 0],
            ['progress', t('statusProgress'), counts.progress ?? 0],
            ['review', t('statusReview'), counts.review ?? 0],
            ['blocked', t('jiraBlocked'), counts.blocked ?? 0],
            ['done', t('statusDone'), counts.done ?? 0],
            ['late', t('jiraOverdue'), counts.overdue ?? 0],
          ].map(([tone, label, value]) =>
            h(
              'div',
              { key: tone, className: `jira-kpi jira-kpi-${tone}` },
              h('span', null, label),
              h('strong', null, String(value)),
              h('i', null),
            ),
          ),
        ),

        /* ------------------------------------------------------- grid */
        h(
          'section',
          { key: 'jira-grid', className: 'jira-grid' },
          h(
            'div',
            { className: 'jira-col' },
            h(
              'article',
              { className: 'dsm-card dsm-table-card' },
              h(
                'header',
                { className: 'dsm-card-head' },
                h('span', { className: 'dsm-glow-dot', style: { '--a1': '#2684ff', '--a2': '#0052cc' } }),
                h('h3', null, t('jiraWorkload')),
                h('span', { className: 'dsm-badge' }, `${visible.length} / ${total}`),
              ),
              h(
                'div',
                { className: 'jira-toolbar' },
                h(
                  'div',
                  { className: 'jira-filters', role: 'group' },
                  ...[
                    ['mine', t('jiraFilterMine')],
                    ['blocked', t('jiraFilterBlocked')],
                    ['due', t('jiraFilterDue')],
                    ['all', t('jiraFilterAll')],
                  ].map(([key, label]) =>
                    h(
                      'button',
                      {
                        key,
                        type: 'button',
                        className: filter === key ? 'on' : '',
                        'aria-pressed': filter === key,
                        onClick: () => setFilter(key),
                      },
                      label,
                    ),
                  ),
                ),
                h(
                  'label',
                  { className: 'jira-search' },
                  h(
                    'svg',
                    { viewBox: '0 0 16 16', width: 11, height: 11, 'aria-hidden': 'true' },
                    h('circle', { cx: 7, cy: 7, r: 4.2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
                    h('path', { d: 'm10.2 10.2 3 3', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
                  ),
                  h('input', {
                    value: query,
                    placeholder: t('jiraSearch'),
                    'aria-label': t('jiraSearch'),
                    onChange: (event) => setQuery(event.target.value),
                    style: {
                      border: 0,
                      background: 'transparent',
                      color: 'inherit',
                      font: 'inherit',
                      outline: 'none',
                      width: '110px',
                    },
                  }),
                ),
              ),
              visible.length === 0
                ? h('p', { className: 'dsm-empty' }, t('jiraNoIssues'))
                : h(
                    'div',
                    { className: 'dsm-table-scroll' },
                    h(
                      'table',
                      { className: 'jira-issues' },
                      h(
                        'thead',
                        null,
                        h(
                          'tr',
                          null,
                          h('th', null, t('jiraTicket')),
                          h('th', null, t('jiraSummary')),
                          h('th', null, t('jiraStatus')),
                          h('th', null, t('jiraPriority')),
                          h('th', null, t('jiraAssignee')),
                          h('th', null, t('jiraDue')),
                          h('th', { style: { textAlign: 'right' } }, t('jiraPoints')),
                          h('th', null, ''),
                        ),
                      ),
                      h(
                        'tbody',
                        null,
                        ...visible.slice(0, 40).map((issue) => {
                          const due = dueLabel(issue.dueDays, t, issue.statusTone === 'done');
                          const busy = pending !== null && pending.endsWith(`:${issue.key}`);
                          return h(
                            'tr',
                            {
                              key: issue.key,
                              className: 'jira-issue-row',
                              onClick: () => openDetail(issue.key),
                              title: issue.summary,
                            },
                            h(
                              'td',
                              { className: 'jira-key-cell' },
                              h('span', { className: `jira-type jira-type-${issue.type}` }, TYPE_GLYPH[issue.type] ?? TYPE_GLYPH.task),
                              h('span', { className: 'jira-key' }, issue.key),
                            ),
                            h(
                              'td',
                              { className: 'jira-summary-cell' },
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'jira-summary-btn',
                                  onClick: (event) => {
                                    event.stopPropagation();
                                    openDetail(issue.key);
                                  },
                                },
                                h('span', { className: 'jira-summary' }, issue.summary),
                                issue.epic ? h('span', { className: 'jira-epic' }, issue.epic) : null,
                              ),
                            ),
                            h(
                              'td',
                              null,
                              h(
                                'span',
                                { className: `jira-status jira-status-${JIRA_STATUS_TONE[issue.statusTone] ?? 'todo'}` },
                                issue.status,
                              ),
                            ),
                            h(
                              'td',
                              null,
                              issue.priority
                                ? h(
                                    'span',
                                    { className: 'jira-prio' },
                                    h('i', { style: { background: priorityColor(issue.priority) } }),
                                    issue.priority,
                                  )
                                : h('span', { className: 'dsm-dim' }, '—'),
                            ),
                            h('td', null, h(JiraAvatar, { person: issue.assignee })),
                            h(
                              'td',
                              { className: `jira-due ${due?.tone ?? ''}` },
                              due ? due.text : '—',
                            ),
                            h('td', { className: 'jira-points' }, issue.points ? String(issue.points) : '—'),
                            h(
                              'td',
                              { className: 'jira-row-actions', onClick: (event) => event.stopPropagation() },
                              h(
                                'div',
                                { className: 'jira-move' },
                                h(
                                  'button',
                                  {
                                    type: 'button',
                                    className: `dsm-act${busy ? ' dsm-act-armed' : ''}`,
                                    title: t('jiraMove'),
                                    'aria-label': t('jiraMove'),
                                    'aria-expanded': openKey === issue.key,
                                    disabled: busy,
                                    onClick: () => openTransitions(issue.key),
                                  },
                                  h(
                                    'svg',
                                    { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true' },
                                    h('path', {
                                      d: 'M3 8h9M9 4.5 12.5 8 9 11.5',
                                      fill: 'none',
                                      stroke: 'currentColor',
                                      strokeWidth: 1.7,
                                      strokeLinecap: 'round',
                                      strokeLinejoin: 'round',
                                    }),
                                  ),
                                ),
                                h(
                                  'a',
                                  {
                                    className: 'dsm-act',
                                    href: issue.url,
                                    target: '_blank',
                                    rel: 'noreferrer',
                                    title: issue.key,
                                    'aria-label': issue.key,
                                  },
                                  h(
                                    'svg',
                                    { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true' },
                                    h('path', {
                                      d: 'M6.5 3.5H3.5v9h9V9.5M9 3.5h3.5V7M12.2 3.8 7.4 8.6',
                                      fill: 'none',
                                      stroke: 'currentColor',
                                      strokeWidth: 1.5,
                                      strokeLinecap: 'round',
                                      strokeLinejoin: 'round',
                                    }),
                                  ),
                                ),
                                openKey === issue.key
                                  ? h(
                                      'div',
                                      { className: 'jira-menu', role: 'menu' },
                                      h('span', { className: 'jira-menu-title' }, t('jiraMoveTo')),
                                      (transitions[issue.key] ?? []).length === 0
                                        ? h('span', { className: 'jira-menu-empty' }, '—')
                                        : (transitions[issue.key] ?? []).map((transition) =>
                                            h(
                                              'button',
                                              {
                                                key: transition.id,
                                                type: 'button',
                                                role: 'menuitem',
                                                className: 'jira-menu-item',
                                                onClick: () => {
                                                  setOpenKey(null);
                                                  runControl(
                                                    'jira.transition',
                                                    issue.key,
                                                    `${issue.key} → ${transition.to || transition.name}`,
                                                    transition.id,
                                                  );
                                                },
                                              },
                                              h('i', { className: `jira-menu-dot jira-menu-${transition.tone}` }),
                                              transition.to || transition.name,
                                            ),
                                          ),
                                    )
                                  : null,
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
            ),
          ),

          h(
            'div',
            { className: 'jira-col' },
            h(
              'article',
              { className: 'dsm-card dsm-table-card' },
              h(
                'header',
                { className: 'dsm-card-head' },
                h('span', { className: 'dsm-glow-dot', style: { '--a1': '#38bdf8', '--a2': '#6366f1' } }),
                h('h3', null, t('jiraDistribution')),
              ),
              h(
                'div',
                { className: 'dsm-phases' },
                h(
                  'div',
                  { className: 'dsm-phase-bar' },
                  ...distribution
                    .filter((entry) => entry.value > 0)
                    .map((entry) =>
                      h('span', {
                        key: entry.key,
                        style: { width: `${(entry.value / Math.max(1, total)) * 100}%`, background: entry.color },
                      }),
                    ),
                ),
                h(
                  'div',
                  { className: 'dsm-phase-legend' },
                  ...distribution.map((entry) =>
                    h(
                      'span',
                      { key: entry.key, className: 'dsm-phase-item' },
                      h('i', { style: { background: entry.color } }),
                      `${entry.value} ${entry.label.toLowerCase()}`,
                    ),
                  ),
                ),
              ),
            ),
            h(
              'article',
              { className: 'dsm-card dsm-table-card' },
              h(
                'header',
                { className: 'dsm-card-head' },
                h('span', { className: 'dsm-glow-dot', style: { '--a1': '#f59e0b', '--a2': '#f97316' } }),
                h('h3', null, t('jiraByPriority')),
              ),
              h(
                'div',
                { className: 'jira-prios' },
                ...(priorities.length > 0 ? priorities : [{ label: '—', value: 0 }]).map((entry) =>
                  h(
                    'div',
                    { key: entry.label, className: 'jira-prio-row' },
                    h('span', { className: 'jira-prio-label' }, entry.label),
                    h(
                      'span',
                      { className: 'jira-prio-track' },
                      h('i', {
                        style: {
                          width: `${(entry.value / priorityPeak) * 100}%`,
                          background: priorityColor(entry.label),
                        },
                      }),
                    ),
                    h('b', null, String(entry.value)),
                  ),
                ),
              ),
            ),
            h(
              'article',
              { className: 'dsm-card dsm-table-card' },
              h(
                'header',
                { className: 'dsm-card-head' },
                h('span', { className: 'dsm-glow-dot', style: { '--a1': '#ef4444', '--a2': '#ec4899' } }),
                h('h3', null, t('jiraWatch')),
                h('span', { className: 'dsm-badge' }, String(watched.length)),
              ),
              watched.length === 0
                ? h('p', { className: 'dsm-empty' }, t('jiraNothingToWatch'))
                : h(
                    'div',
                    { className: 'jira-watch' },
                    ...watched.map((issue) => {
                      const due = dueLabel(issue.dueDays, t, issue.statusTone === 'done');
                      return h(
                        'a',
                        {
                          key: issue.key,
                          className: 'jira-watch-row',
                          href: issue.url,
                          target: '_blank',
                          rel: 'noreferrer',
                        },
                        h(
                          'span',
                          { className: 'jira-watch-head' },
                          h('span', { className: 'jira-key' }, issue.key),
                          h(
                            'span',
                            { className: `jira-watch-flag${issue.blocked ? ' is-blocked' : ''}` },
                            issue.blocked ? t('jiraBlockedOne') : '',
                            due ? (issue.blocked ? ' · ' : '') + due.text : '',
                          ),
                        ),
                        h('span', { className: 'jira-watch-text' }, issue.summary),
                      );
                    }),
                  ),
            ),
          ),
        ),

        h(JiraDrawer, {
          key: 'drawer',
          detailKey,
          detail,
          fallbackIssue: issues.find((issue) => issue.key === detailKey) ?? null,
          transitions: detailKey ? transitions[detailKey] : null,
          onClose: closeDetail,
          onTransition: (key, transition) => {
            closeDetail();
            runControl('jira.transition', key, `${key} → ${transition.to || transition.name}`, transition.id);
          },
          pending,
          t,
        }),
      ];
    }

    /** The issue drawer: fields, description, comments, and the transitions. */
    function JiraDrawer({ detailKey, detail, fallbackIssue, transitions, onClose, onTransition, pending, t }) {
      useEffect(() => {
        if (!detailKey) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, [detailKey, onClose]);

      if (!detailKey) return null;
      const issue = detail?.status === 'ready' ? detail.data : null;
      // While loading, or when the detail call fails, the row we already have
      // keeps the drawer readable instead of empty.
      const fallback = fallbackIssue ?? null;
      const shown = issue ?? fallback;
      const pendingDetail = detail?.status !== 'ready';
      const due = issue ? dueLabel(issue.dueDays, t) : null;
      const busy = pending !== null && pending.endsWith(`:${detailKey}`);

      return h(
        'div',
        { className: 'jira-overlay', role: 'presentation' },
        h('div', { className: 'jira-scrim', onClick: onClose, role: 'presentation' }),
        h(
          'aside',
          { className: 'jira-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': detailKey },
          h(
            'div',
            { className: 'jira-drawer-head' },
            h(
              'div',
              { className: 'jira-drawer-crumb' },
              h('span', { className: `jira-type jira-type-${shown?.type ?? 'task'}` }, TYPE_GLYPH[shown?.type] ?? TYPE_GLYPH.task),
              h('span', { className: 'jira-key' }, detailKey),
              shown?.epic ? h('span', null, `· ${shown.epic}`) : null,
              h(
                'button',
                { type: 'button', className: 'jira-drawer-close', onClick: onClose, 'aria-label': t('close') },
                '×',
              ),
            ),
            h('h2', { className: 'jira-drawer-title' }, shown?.summary ?? detailKey),
            detail?.status === 'loading'
              ? h('span', { className: 'jira-drawer-muted' }, t('loading'))
              : detail?.status === 'error'
                ? h('span', { className: 'jira-drawer-muted jira-error' }, detail.error)
                : null,
            shown
              ? h(
                  'div',
                  { className: 'jira-drawer-tags' },
                  h('span', { className: `jira-status jira-status-${JIRA_STATUS_TONE[shown.statusTone] ?? 'todo'}` }, shown.status),
                  shown.priority
                    ? h(
                        'span',
                        { className: 'jira-prio' },
                        h('i', { style: { background: priorityColor(shown.priority) } }),
                        shown.priority,
                      )
                    : null,
                  shown.due ? h('span', { className: 'dsm-badge' }, due?.text || formatDay(shown.due)) : null,
                  h('span', { className: 'jira-drawer-spacer' }),
                  h(JiraAvatar, { person: shown.assignee }),
                )
              : null,
          ),
          !pendingDetail && !issue
            ? h(
                'div',
                { className: 'jira-drawer-body' },
                h(
                  'p',
                  { className: 'jira-drawer-muted jira-error' },
                  detail?.error ?? t('noDescription'),
                ),
              )
            : issue
            ? h(
                'div',
                { className: 'jira-drawer-body' },
                h(
                  'div',
                  { className: 'jira-fields' },
                  ...[
                    [t('jiraAssignee'), issue.assignee?.name ?? '—'],
                    [t('reporter'), issue.reporter?.name ?? '—'],
                    [t('jiraDue'), issue.due ? `${formatDay(issue.due)}${due?.text ? ` · ${due.text}` : ''}` : '—'],
                    [t('labels'), issue.labels.length > 0 ? issue.labels.join(' · ') : '—'],
                    [t('epic'), issue.epic || '—'],
                    [
                      t('subtasks'),
                      issue.subtasks.total > 0
                        ? `${issue.subtasks.done} / ${issue.subtasks.total}`
                        : '—',
                    ],
                  ].map(([label, value]) =>
                    h(
                      'div',
                      { key: label, className: 'jira-field' },
                      h('span', null, label),
                      h('strong', null, value),
                    ),
                  ),
                ),
                issue.subtasks.total > 0
                  ? h('div', { className: 'jira-subtasks' },
                      h(
                        'span',
                        { className: 'jira-prio-track' },
                        h('i', {
                          style: {
                            width: `${Math.round((issue.subtasks.done / issue.subtasks.total) * 100)}%`,
                            background: 'linear-gradient(90deg,#38bdf8,#6366f1)',
                          },
                        }),
                      ),
                    )
                  : null,
                h('div', null,
                  h('h3', { className: 'jira-section-title' }, t('description')),
                  h('p', { className: 'jira-desc' }, issue.description || t('noDescription')),
                ),
                issue.comments.length > 0
                  ? h(
                      'div',
                      null,
                      h('h3', { className: 'jira-section-title' }, `${t('activity')} · ${issue.comments.length}`),
                      ...issue.comments.map((comment, index) =>
                        h(
                          'div',
                          { key: `${comment.at}-${index}`, className: 'jira-comment' },
                          h(JiraAvatar, {
                            person: { name: comment.author, initials: comment.initials, color: comment.color },
                          }),
                          h(
                            'div',
                            null,
                            h(
                              'span',
                              { className: 'jira-comment-who' },
                              comment.author,
                              h('span', { className: 'jira-comment-at' }, hoursAgo(comment.at, t) ?? ''),
                            ),
                            h('p', { className: 'jira-comment-text' }, comment.body),
                          ),
                        ),
                      ),
                    )
                  : null,
              )
            : h('div', { className: 'jira-drawer-body' }),
          h(
            'div',
            { className: 'jira-drawer-foot' },
            ...(transitions ?? []).slice(0, 3).map((transition) =>
              h(
                'button',
                {
                  key: transition.id,
                  type: 'button',
                  className: 'jira-btn jira-btn-primary',
                  disabled: busy,
                  onClick: () => onTransition(detailKey, transition),
                },
                busy ? t('working') : `${t('jiraMoveTo')} ${transition.to || transition.name}`,
              ),
            ),
            h(
              'a',
              {
                className: 'jira-btn',
                href: issue?.url ?? '#',
                target: '_blank',
                rel: 'noreferrer',
              },
              t('jiraOpen'),
            ),
            h('button', { type: 'button', className: 'jira-btn jira-btn-ghost', onClick: onClose }, t('close')),
          ),
        ),
      );
    }

    /** Priority colours shared by the table dots and the load bars. */
    function priorityColor(label) {
      const value = String(label ?? '').toLowerCase();
      if (value.includes('block')) return '#ef4444';
      if (value.includes('crit') || value.includes('high') || value.includes('haute')) return '#f97316';
      if (value.includes('major') || value.includes('majeur') || value.includes('medium')) return '#f59e0b';
      if (value.includes('minor') || value.includes('mineur') || value.includes('low') || value.includes('basse')) return '#64748b';
      return '#94a3b8';
    }

    /** Issue-type glyphs, matching the shapes the proposal used. */
    const TYPE_GLYPH = {
      bug: h(
        'svg',
        { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true' },
        h('circle', { cx: 8, cy: 8, r: 5.4, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }),
        h('path', { d: 'M8 5.4v3.2', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
      ),
      story: h(
        'svg',
        { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true' },
        h('path', {
          d: 'M4 2.5h8a1 1 0 0 1 1 1v9.4l-5-2.6-5 2.6V3.5a1 1 0 0 1 1-1Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinejoin: 'round',
        }),
      ),
      task: h(
        'svg',
        { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true' },
        h('rect', {
          x: 2.8,
          y: 2.8,
          width: 10.4,
          height: 10.4,
          rx: 2.4,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
        }),
        h('path', {
          d: 'm5.6 8 1.7 1.8L10.6 6.3',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      ),
    };

    /* --------------------------------------------------------------- panel */

    function DashboardView(props) {
      const { data, status, error, at, refreshing, onRefresh, hidden, t } = props;
      const [range, setRange] = useState(30);
      const [metric, setMetric] = useState('cpu');
      const [pending, setPending] = useState(null);
      const [notice, setNotice] = useState(null);
      // `tab` lets a caller open the panel straight on a section.
      const [tab, setTab] = useState(() => (TABS.some((entry) => entry.id === props.tab) ? props.tab : 'system'));
      const [unseenAlerts, setUnseenAlerts] = useState(0);
      const { onSnapshot } = props;

      /** POST one control and publish the snapshot the Host returns with it. */
      const runControl = useCallback(
        async (action, target, label, value) => {
          setPending(`${action}:${target}`);
          try {
            const response = await fetch(new URL(ACTION_ROUTE, document.baseURI), {
              method: 'POST',
              headers: { 'content-type': 'application/json', accept: 'application/json' },
              body: JSON.stringify(value === undefined ? { action, target } : { action, target, value }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload || payload.ok !== true) {
              throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }
            if (payload.snapshot && onSnapshot) onSnapshot(payload.snapshot);
            setNotice({ tone: 'ok', text: `${label} · ${t('actionDone')}` });
          } catch (error) {
            setNotice({
              tone: 'error',
              text: `${label} · ${t('actionFailed')}: ${error instanceof Error ? error.message : String(error)}`,
            });
          } finally {
            setPending(null);
            window.setTimeout(() => setNotice(null), 7000);
          }
        },
        [onSnapshot, t],
      );
      const language =
        props.language ||
        (typeof document !== 'undefined' ? document.documentElement.lang : '') ||
        (typeof navigator !== 'undefined' ? navigator.language : '') ||
        'en';
      const formatBytes = useMemo(() => makeByteFormatter(language), [language]);

      const meta = data?.meta ?? {};
      const system = data?.system ?? {};
      const history = Array.isArray(data?.history) ? data.history : [];
      const infra = data?.infra ?? {};
      const cpu = system.cpu ?? {};
      const memory = system.memory ?? {};
      const disk = system.disk ?? {};
      const net = system.net ?? {};
      const swap = system.swap ?? null;
      const battery = system.battery ?? null;
      const processes = Array.isArray(system.processes) ? system.processes : [];
      const docker = infra.docker ?? null;
      const colima = infra.colima ?? null;
      const kubernetes = infra.kubernetes ?? null;
      const devspace = infra.devspace ?? null;

      const windowed = useMemo(() => (range >= history.length ? history : history.slice(-range)), [history, range]);

      const chartSeries = useMemo(() => {
        if (metric === 'cpu') {
          return [
            { key: 'cpu', label: t('cpu'), from: '#7c9cff', to: '#22d3ee', values: windowed.map((point) => point.cpu) },
          ];
        }
        if (metric === 'memory') {
          return [
            {
              key: 'mem',
              label: t('memory'),
              from: '#c084fc',
              to: '#f472b6',
              values: windowed.map((point) => point.mem),
            },
          ];
        }
        if (metric === 'disk') {
          return [
            { key: 'disk', label: t('disk'), from: '#fbbf24', to: '#fb923c', values: windowed.map((point) => point.disk) },
          ];
        }
        return [
          { key: 'rx', label: t('down'), from: '#34d399', to: '#22d3ee', values: windowed.map((point) => point.rx) },
          { key: 'tx', label: t('up'), from: '#a78bfa', to: '#818cf8', values: windowed.map((point) => point.tx) },
        ];
      }, [metric, windowed, t]);

      const chartFormatter = useCallback(
        (value) => (metric === 'network' ? formatBytes(value) : formatPercent(value)),
        [metric, formatBytes],
      );

      const cpuCores = Array.isArray(cpu.perCore) ? cpu.perCore : [];
      const memorySegments = memory.total
        ? [
            { key: 'app', label: t('app'), percent: (memory.app / memory.total) * 100, color: '#a78bfa' },
            { key: 'wired', label: t('wired'), percent: (memory.wired / memory.total) * 100, color: '#38bdf8' },
            {
              key: 'compressed',
              label: t('compressed'),
              percent: (memory.compressed / memory.total) * 100,
              color: '#f472b6',
            },
            { key: 'cached', label: t('cached'), percent: (memory.cached / memory.total) * 100, color: '#64748b' },
            { key: 'free', label: t('free'), percent: (memory.free / memory.total) * 100, color: 'var(--dsm-track)' },
          ].map((segment) => ({
            ...segment,
            display: formatBytes((segment.percent / 100) * memory.total),
          }))
        : [];

      const jira = data?.jira ?? null;
      const workspace = data?.workspace ?? null;
      const news = data?.news ?? null;
      const todos = data?.todos ?? null;
      const onJira = tab === 'jira';
      const jiraReady = jira?.configured === true && jira?.connected === true;
      const offline = status === 'error';
      const stale = status === 'stale';

      // Surface genuinely new important news once, and badge it on the tab.
      useEffect(() => {
        const alerts = news?.alerts ?? [];
        if (alerts.length === 0) return;
        if (!alertMemory.ready) {
          alertMemory.ready = true;
          for (const alert of alerts) alertMemory.seen.add(alert.id);
          return;
        }
        const fresh = alerts.filter((alert) => !alertMemory.seen.has(alert.id));
        if (fresh.length === 0) return;
        for (const alert of fresh) alertMemory.seen.add(alert.id);
        setUnseenAlerts((count) => count + fresh.length);
        setNotice({ tone: 'warn', text: `${t('importantNews')} · ${fresh[0].title}` });
        window.setTimeout(() => setNotice(null), 12000);
      }, [news?.asOf]);

      const workspaceSections = ['network', 'security', 'github', 'confluence'];
      const watchSections = ['veille', 'cyber'];
      const sectionPending =
        tab === 'k8s'
          ? kubernetes === null
          : tab === 'docker'
            ? docker === null
            : tab === 'processes'
              ? data === null
              : workspaceSections.includes(tab)
                ? workspace === null || workspace.pending === true
                : watchSections.includes(tab)
                  ? news === null || news.pending === true
                  : tab === 'project'
                    ? data?.jiraProject == null || data.jiraProject.pending === true
                    : false;
      const staleHost = data !== null && data?.schemaVersion !== HOST_SCHEMA;
      const sectionError = watchSections.includes(tab)
        ? data?.errors?.news
        : workspaceSections.includes(tab)
          ? data?.errors?.workspace
          : tab === 'k8s' || tab === 'docker'
            ? data?.errors?.slow
            : null;

      const activeTab = TABS.find((entry) => entry.id === tab) ?? TABS[0];
      const tabName = t(activeTab.label);
      const heroEyebrow =
        tab === 'jira'
          ? `Jira${jira?.project?.key ? ` · ${jira.project.key}` : ''}`
          : tab === 'system'
            ? t('eyebrow')
            : `${t('eyebrow')} · ${tabName}`;
      const heroTitle =
        tab === 'jira'
          ? jira?.sprint?.name || jira?.project?.name || t('tabJira')
          : tab === 'system'
            ? meta.computerName || meta.hostname || t('eyebrow')
            : tabName;
      const sprintInfo = jira?.sprint ?? null;
      const heroChips = onJira
        ? [
            sprintInfo?.startDate && sprintInfo?.endDate
              ? h(
                  'span',
                  { key: 'dates', className: 'dsm-chip' },
                  `${formatDay(sprintInfo.startDate)} → ${formatDay(sprintInfo.endDate)}`,
                )
              : null,
            sprintInfo?.daysLeft !== null && sprintInfo?.daysLeft !== undefined
              ? h('span', { key: 'left', className: 'dsm-chip' }, `${sprintInfo.daysLeft} ${t('jiraDayLeft')}`)
              : null,
            jiraReady
              ? h(
                  'span',
                  { key: 'total', className: 'dsm-chip' },
                  `${jira.counts?.total ?? 0} ${t('jiraTicketLower')}`,
                )
              : null,
            jiraReady
              ? h('span', { key: 'prog', className: 'dsm-chip' }, `${jira.progress ?? 0} % ${t('jiraDone')}`)
              : null,
            jira?.project
              ? h('span', { key: 'proj', className: 'dsm-chip dsm-chip-quiet' }, jira.project.name)
              : null,
          ].filter(Boolean)
        : tab !== 'system'
        ? []
        : [
            meta.osVersion ? h('span', { key: 'os', className: 'dsm-chip' }, meta.osVersion) : null,
            meta.chip ? h('span', { key: 'chip', className: 'dsm-chip' }, meta.chip) : null,
            meta.cores
              ? h('span', { key: 'cores', className: 'dsm-chip' }, `${meta.cores} ${t('coresLabel')}`)
              : null,
            meta.memoryTotal
              ? h('span', { key: 'mem', className: 'dsm-chip' }, formatBytes(meta.memoryTotal, 0))
              : null,
            meta.uptime
              ? h(
                  'span',
                  { key: 'up', className: 'dsm-chip dsm-chip-quiet' },
                  `${t('uptimeLabel')} ${formatUptime(meta.uptime)}`,
                )
              : null,
          ].filter(Boolean);

      return h(
        'div',
        { className: 'dsm-root' },
        h('style', null, CSS),
        h('div', { className: 'dsm-aurora', 'aria-hidden': 'true' }, h('i', null), h('i', null), h('i', null)),
        h('div', { className: 'dsm-texture', 'aria-hidden': 'true' }),
        h(
          'div',
          { className: 'dsm-scroll' },
          h(
            'div',
            { className: 'dsm-content' },
            /* ---------------------------------------------------- hero */
            h(
              'header',
              { className: 'dsm-hero' },
              h(
                'div',
                { className: 'dsm-hero-main' },
                h(
                  'div',
                  { className: 'dsm-eyebrow' },
                  h('span', { className: `dsm-live${stale || offline || hidden ? ' dsm-live-idle' : ''}` }),
                  h('span', null, heroEyebrow),
                  h('span', { className: 'dsm-sep' }, '/'),
                  h(
                    'span',
                    { className: 'dsm-eyebrow-state' },
                    offline
                      ? t('offline')
                      : stale
                        ? t('retrying')
                        : hidden
                          ? t('paused')
                          : onJira
                            ? `${t('jiraSynced')} ${jira?.asOf ? hoursAgo(new Date(jira.asOf).toISOString(), t) : '—'}`
                            : t('live'),
                  ),
                ),
                h('h1', { className: 'dsm-title' }, heroTitle),
                h('div', { className: 'dsm-chips' }, ...heroChips),
              ),
              h(
                'div',
                { className: 'dsm-hero-side' },
                h(
                  'div',
                  { className: 'dsm-stamp' },
                  h('span', null, t('updated')),
                  h('b', null, at ? formatClock(at) : '—'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: `dsm-refresh${refreshing ? ' dsm-refresh-busy' : ''}`,
                    onClick: onRefresh,
                    disabled: refreshing,
                    title: t('refresh'),
                    'aria-label': t('refresh'),
                  },
                  h(
                    'svg',
                    { viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true' },
                    h('path', {
                      d: 'M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: '1.8',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                    }),
                  ),
                ),
              ),
            ),

            h(
              'div',
              { className: 'jira-tabbar' },
              h(
                'div',
                { className: 'jira-tabs', role: 'tablist' },
                ...TABS.map((entry) =>
                  h(
                    'button',
                    {
                      key: entry.id,
                      type: 'button',
                      role: 'tab',
                      'aria-selected': tab === entry.id,
                      className: `jira-tab${tab === entry.id ? ' jira-tab-on' : ''}`,
                      onClick: () => setTab(entry.id),
                    },
                    entry.icon,
                    t(entry.label),
                    entry.id === 'jira' && jiraReady && (jira?.counts?.blocked ?? 0) > 0
                      ? h('span', { className: 'dsm-badge' }, `${jira.counts.blocked} ${t('jiraBlockedBadge')}`)
                      : null,
                    entry.id === 'github' && (workspace?.github?.unreadCount ?? 0) > 0
                      ? h('span', { className: 'dsm-badge' }, String(workspace.github.unreadCount))
                      : null,
                    entry.id === 'cyber' && unseenAlerts > 0
                      ? h('span', { className: 'dsm-badge dsm-badge-alert' }, String(unseenAlerts))
                      : null,
                    entry.id === 'todos' && (todos?.dueToday ?? 0) + (todos?.overdue ?? 0) > 0
                      ? h(
                          'span',
                          { className: 'dsm-badge dsm-badge-alert' },
                          String((todos.dueToday ?? 0) + (todos.overdue ?? 0)),
                        )
                      : null,
                  ),
                ),
              ),
            ),

            staleHost
              ? h(
                  'div',
                  { className: 'dsm-banner dsm-banner-warn', role: 'status' },
                  h('strong', null, t('staleHost')),
                  h('span', null, t('staleHostHint')),
                )
              : null,
            notice
              ? h(
                  'div',
                  { className: `dsm-toast dsm-toast-${notice.tone}`, role: 'status', 'aria-live': 'polite' },
                  h('span', { className: 'dsm-toast-dot' }),
                  notice.text,
                )
              : null,
            offline
              ? h(
                  'div',
                  { className: 'dsm-banner dsm-banner-error', role: 'alert' },
                  h('strong', null, t('offline')),
                  h('span', null, error ?? ''),
                )
              : null,

            /* ------------------------------------------------- vitals */
            sectionPending
              ? h(LoadingPanel, { t, title: t(activeTab.label) })
              : sectionError
              ? h(ErrorPanel, { t, title: t(activeTab.label), message: sectionError })
              : tab === 'jira'
              ? h(JiraView, { jira, t, runControl, pending, initialIssue: props.initialIssue })
              : tab === 'k8s'
              ? h(KubernetesView, { k8s: kubernetes, t, formatBytes, runControl, pending })
              : tab === 'docker'
              ? h(DockerView, { docker, t, formatBytes, runControl, pending })
              : tab === 'processes'
              ? h(ProcessesView, { system, t, formatBytes, runControl, pending })
              : tab === 'network'
              ? h(NetworkView, { workspace, system, t, formatBytes })
              : tab === 'security'
              ? h(SecurityView, { workspace, meta, t })
              : tab === 'github'
              ? h(GithubView, { workspace, t })
              : tab === 'confluence'
              ? h(ConfluenceView, { workspace, t })
              : tab === 'project'
              ? h(ProjectView, { project: data?.jiraProject ?? null, t })
              : tab === 'todos'
              ? h(TodosView, { summary: todos, t, initialTodos: props.initialTodos })
              : tab === 'veille'
              ? h(VeilleView, { news, t })
              : tab === 'cyber'
              ? h(CyberView, { news, t })
              : [
            h(
              'section',
              { className: 'dsm-vitals' },
              h(
                VitalCard,
                {
                  accent: ['#7c9cff', '#22d3ee'],
                  label: t('cpu'),
                  badge: cpu.cores ? `${cpu.cores} ${t('coresLabel')}` : null,
                  value: formatPercent(cpu.usage),
                  hint: `${t('loadLabel')} ${(cpu.load?.[0] ?? 0).toFixed(2)} · ${(cpu.load?.[1] ?? 0).toFixed(2)} · ${(cpu.load?.[2] ?? 0).toFixed(2)}`,
                  side: h(Donut, { value: cpu.usage, from: '#7c9cff', to: '#22d3ee', size: 78, stroke: 8 }),
                  stack: [
                    cpuCores.length > 1
                      ? h(
                          'div',
                          { key: 'cores', className: 'dsm-cores', 'aria-hidden': 'true' },
                          ...cpuCores.map((core, index) =>
                            h(
                              'span',
                              { key: index, className: 'dsm-core' },
                              h('i', { style: { height: `${clamp(core, 3, 100)}%` } }),
                            ),
                          ),
                        )
                      : null,
                    h(Sparkline, {
                      key: 'spark',
                      values: windowed.map((point) => point.cpu),
                      from: '#7c9cff',
                      to: '#22d3ee',
                      height: 38,
                    }),
                  ],
                },
              ),
              h(
                VitalCard,
                {
                  accent: ['#c084fc', '#f472b6'],
                  label: t('memory'),
                  badge: formatBytes(memory.total, 0),
                  value: formatPercent(memory.percent),
                  hint: `${formatBytes(memory.used)} / ${formatBytes(memory.total, 0)}`,
                  side: h(Donut, { value: memory.percent, from: '#c084fc', to: '#f472b6', size: 78, stroke: 8 }),
                  stack: [
                    h(StackedBar, { key: 'stacked', segments: memorySegments }),
                    swap && swap.percent > 0
                      ? h(
                          'div',
                          { key: 'swap', className: 'dsm-swap' },
                          h('span', null, `${t('swap')} ${formatPercent(swap.percent)}`),
                          h('b', null, formatBytes(swap.used)),
                        )
                      : null,
                    h(Sparkline, {
                      key: 'spark',
                      values: windowed.map((point) => point.mem),
                      from: '#c084fc',
                      to: '#f472b6',
                      height: 38,
                    }),
                  ],
                },
              ),
              h(
                VitalCard,
                {
                  accent: ['#fbbf24', '#fb923c'],
                  label: t('disk'),
                  badge: disk.mount ? disk.mount.replace('/System/Volumes/', '') : null,
                  value: formatPercent(disk.percent),
                  hint: disk.total
                    ? `${formatBytes(disk.used, 0)} / ${formatBytes(disk.total, 0)}`
                    : t('noData'),
                  side: h(Donut, { value: disk.percent, from: '#fbbf24', to: '#fb923c', size: 78, stroke: 8 }),
                  stack: [
                    h(
                      'div',
                      { key: 'mounts', className: 'dsm-mounts' },
                      ...(disk.mounts ?? []).slice(0, 3).map((mount) =>
                        h(
                          'div',
                          { key: mount.mount, className: 'dsm-mount' },
                          h(
                            'span',
                            { className: 'dsm-mount-name' },
                            h('em', null, mount.mount.replace('/System/Volumes/', '')),
                            h('b', null, formatPercent(mount.percent)),
                          ),
                          h(Meter, { value: mount.percent, from: '#fbbf24', to: '#fb923c', height: 3 }),
                        ),
                      ),
                    ),
                    h(Sparkline, {
                      key: 'spark',
                      values: windowed.map((point) => point.disk),
                      from: '#fbbf24',
                      to: '#fb923c',
                      height: 38,
                    }),
                  ],
                },
              ),
              h(
                VitalCard,
                {
                  accent: ['#34d399', '#22d3ee'],
                  label: t('network'),
                  badge: net.interfaces?.[0]?.name ?? null,
                  value: formatBytes(net.rxRate ?? 0),
                  unit: '/s',
                  hint: `${t('up')} ${formatBytes(net.txRate ?? 0)}/s`,
                  side: h(
                    'div',
                    { className: 'dsm-net-totals' },
                    h(
                      'div',
                      { className: 'dsm-net-total' },
                      h('span', { className: 'dsm-net-arrow' }, '↓'),
                      h('b', null, formatBytes(net.rxTotal ?? 0, 0)),
                      h('small', null, t('receive')),
                    ),
                    h(
                      'div',
                      { className: 'dsm-net-total' },
                      h('span', { className: 'dsm-net-arrow dsm-net-arrow-up' }, '↑'),
                      h('b', null, formatBytes(net.txTotal ?? 0, 0)),
                      h('small', null, t('transmit')),
                    ),
                  ),
                  stack: [
                    h(Sparkline, {
                      key: 'spark',
                      values: windowed.map((point) => point.rx),
                      from: '#34d399',
                      to: '#22d3ee',
                      height: 38,
                    }),
                    battery && battery.percent !== null
                      ? h(
                          'div',
                          { key: 'battery', className: 'dsm-battery' },
                          h('span', {
                            className: `dsm-battery-gauge${battery.charging ? ' dsm-battery-charging' : ''}`,
                          }),
                          `${battery.percent}%${battery.remaining ? ` · ${battery.remaining}` : ''}`,
                        )
                      : null,
                  ],
                },
              ),
            ),

            /* ----------------------------- docker · kubernetes / colima · devspace */
            h(
              'section',
              { className: 'dsm-infra-grid' },

              h(
                'section',
                { className: 'dsm-card dsm-docker', style: { order: 1, '--a1': '#38bdf8', '--a2': '#0ea5e9' } },
                h(
                  'header',
                  { className: 'dsm-card-head' },
                  h('span', { className: 'dsm-glow-dot' }),
                  h('h3', null, t('docker')),
                  docker?.available
                    ? h(
                        Pill,
                        { tone: docker.summary?.running > 0 ? 'ok' : 'idle' },
                        `${docker.summary?.running ?? 0} / ${docker.summary?.total ?? 0} ${t('running')}`,
                      )
                    : h(Pill, { tone: 'off' }, docker ? t('unavailable') : t('notInstalled')),
                  h('span', { className: 'dsm-head-spacer' }),
                  docker?.available && docker.summary?.serverVersion
                    ? h('span', { className: 'dsm-badge' }, `v${docker.summary.serverVersion}`)
                    : null,
                ),
                docker?.available
                  ? h(
                      'div',
                      { className: 'dsm-stats' },
                      h(Stat, { label: t('containers'), value: `${docker.summary?.running ?? 0} / ${docker.summary?.total ?? 0}` }),
                      h(Stat, { label: t('images'), value: String(docker.summary?.images ?? 0) }),
                      h(Stat, { label: t('totalCpu'), value: `${(docker.summary?.cpuTotal ?? 0).toFixed(0)}%` }),
                      h(Stat, { label: t('totalMemory'), value: formatBytes(docker.summary?.memUsed ?? 0) }),
                      h(Stat, { label: t('engine'), value: docker.summary?.serverVersion ? `v${docker.summary.serverVersion}` : '—' }),
                      h(Stat, { label: t('driver'), value: docker.summary?.driver || '—' }),
                      h(Stat, {
                        label: t('healthIssues'),
                        value: String(docker.summary?.healthIssues ?? 0),
                        tone: docker.summary?.healthIssues > 0 ? 'warn' : undefined,
                      }),
                    )
                  : null,
                docker?.available && docker.containers?.length
                  ? h(
                      'div',
                      { className: 'dsm-table-scroll' },
                      h(
                        'table',
                        { className: 'dsm-table dsm-table-actions' },
                        h(
                          'thead',
                          null,
                          h(
                            'tr',
                            null,
                            h('th', null, t('containerName')),
                            h('th', null, t('containerState')),
                            h('th', { className: 'dsm-num' }, t('containerCpu')),
                            h('th', { className: 'dsm-num' }, t('containerMemory')),
                            h('th', { className: 'dsm-num' }, t('containerPids')),
                            h('th', { className: 'dsm-ports-col' }, t('ports')),
                            h('th', { className: 'dsm-act-col' }, t('actions')),
                          ),
                        ),
                        h(
                          'tbody',
                          null,
                          ...docker.containers.slice(0, 12).map((container) => {
                            const busy = pending !== null && pending.endsWith(`:${container.name}`);
                            const mappings = String(container.ports ?? '')
                              .split(',')
                              .map((entry) => entry.trim())
                              .filter(Boolean);
                            const portsLabel =
                              mappings.length === 0
                                ? '—'
                                : mappings.length === 1
                                  ? mappings[0]
                                  : `${mappings[0]} +${mappings.length - 1}`;
                            return h(
                              'tr',
                              { key: container.id || container.name },
                              h(
                                'td',
                                null,
                                h('span', { className: 'dsm-cell-name' }, container.name),
                                h('span', { className: 'dsm-cell-sub' }, `${container.image} · ${container.status}`),
                              ),
                              h(
                                'td',
                                null,
                                h(
                                  'span',
                                  {
                                    className: `dsm-state dsm-state-${container.state === 'running' ? 'ok' : container.state === 'exited' ? 'idle' : 'warn'}`,
                                  },
                                  container.state,
                                ),
                              ),
                              h(
                                'td',
                                { className: 'dsm-num' },
                                typeof container.cpu === 'number' ? `${container.cpu.toFixed(1)}%` : '—',
                              ),
                              h(
                                'td',
                                { className: 'dsm-num' },
                                container.memUsed === null ? '—' : formatBytes(container.memUsed),
                              ),
                              h('td', { className: 'dsm-num' }, container.pids === null ? '—' : String(container.pids)),
                              h(
                                'td',
                                { className: 'dsm-ports-col' },
                                h('span', { className: 'dsm-ports', title: container.ports || '' }, portsLabel),
                              ),
                              h(
                                'td',
                                { className: 'dsm-act-col' },
                                h(
                                  'div',
                                  { className: 'dsm-act-row' },
                                  h(ActionButton, {
                                    icon: 'restart',
                                    label: `${t('restart')} ${container.name}`,
                                    confirmLabel: t('confirm'),
                                    disabled: busy,
                                    onRun: () => runControl('docker.restart', container.name, `${t('restart')} ${container.name}`),
                                  }),
                                  container.state === 'running'
                                    ? h(ActionButton, {
                                        icon: 'stop',
                                        tone: 'danger',
                                        label: `${t('stop')} ${container.name}`,
                                        confirmLabel: t('confirm'),
                                        disabled: busy,
                                        onRun: () => runControl('docker.stop', container.name, `${t('stop')} ${container.name}`),
                                      })
                                    : h(ActionButton, {
                                        icon: 'play',
                                        tone: 'go',
                                        label: `${t('start')} ${container.name}`,
                                        confirmLabel: t('confirm'),
                                        disabled: busy,
                                        onRun: () => runControl('docker.start', container.name, `${t('start')} ${container.name}`),
                                      }),
                                ),
                              ),
                            );
                          }),
                        ),
                      ),
                    )
                  : h('p', { className: 'dsm-empty' }, t('noData')),
              ),

              /* ------------------------------------------------ colima */
              h(
                'article',
                { className: 'dsm-card dsm-infra', style: { order: 3, '--a1': '#2dd4bf', '--a2': '#14b8a6' } },
                h(
                  'header',
                  { className: 'dsm-card-head' },
                  h('span', { className: 'dsm-glow-dot' }),
                  h('h3', null, t('colima')),
                  h(
                    Pill,
                    { tone: colima?.available ? (colima.running ? 'ok' : 'idle') : 'off' },
                    colima?.available ? (colima.running ? t('running') : t('stopped')) : t('notInstalled'),
                  ),
                  h('span', { className: 'dsm-head-spacer' }),
                  colima?.version ? h('span', { className: 'dsm-badge' }, `v${colima.version}`) : null,
                  colima?.available
                    ? colima.running
                      ? h(ActionButton, {
                          text: t('vmStop'),
                          tone: 'danger',
                          label: t('vmStop'),
                          confirmLabel: t('confirm'),
                          disabled: pending?.endsWith(`:${colima.profile}`),
                          onRun: () => runControl('colima.stop', colima.profile, t('vmStop')),
                        })
                      : h(ActionButton, {
                          text: t('vmStart'),
                          tone: 'go',
                          label: t('vmStart'),
                          confirmLabel: t('confirm'),
                          disabled: pending?.endsWith(`:${colima.profile}`),
                          onRun: () => runControl('colima.start', colima.profile, t('vmStart')),
                        })
                    : null,
                ),
                colima?.available
                  ? h(
                      'div',
                      { className: 'dsm-stats dsm-stats-3' },
                      h(Stat, { label: t('vcpu'), value: String(colima.profiles?.[0]?.cpus ?? '—') }),
                      h(Stat, { label: t('vmMemory'), value: formatBytes(colima.profiles?.[0]?.memory ?? 0) }),
                      h(Stat, { label: t('vmDisk'), value: formatBytes(colima.profiles?.[0]?.disk ?? 0) }),
                    )
                  : null,
                colima?.available
                  ? h(
                      'dl',
                      { className: 'dsm-rows dsm-rows-cols' },
                      ...[
                        [t('profile'), colima.profile ?? '—'],
                        [t('arch'), colima.detail?.mountType ? colima.profiles?.[0]?.arch ?? '—' : colima.profiles?.[0]?.arch ?? '—'],
                        [t('driver'), colima.detail?.driver ?? '—'],
                        [t('mount'), colima.detail?.mountType ?? '—'],
                        [t('kubernetesInVm'), colima.detail ? (colima.detail.kubernetes ? t('active') : t('inactive')) : '—'],
                        [t('dockerSocket'), colima.detail?.dockerSocket ?? colima.socket ?? '—'],
                      ].map(([label, value]) =>
                        h(
                          'div',
                          { key: label, className: 'dsm-row' },
                          h('dt', null, label),
                          h('dd', { title: String(value) }, value),
                        ),
                      ),
                    )
                  : null,
              ),

              /* ---------------------------------------------- kubernetes */
              h(
                'article',
                { className: 'dsm-card dsm-infra', style: { order: 2, '--a1': '#818cf8', '--a2': '#6366f1' } },
                h(
                  'header',
                  { className: 'dsm-card-head' },
                  h('span', { className: 'dsm-glow-dot' }),
                  h('h3', null, t('kubernetes')),
                  h(
                    Pill,
                    { tone: kubernetes?.connected ? (kubernetes.deployments?.degraded > 0 ? 'warn' : 'ok') : 'off' },
                    kubernetes?.connected ? t('connected') : kubernetes?.available ? t('disconnected') : t('notInstalled'),
                  ),
                  h('span', { className: 'dsm-head-spacer' }),
                  kubernetes?.serverVersion
                    ? h('span', { className: 'dsm-badge' }, kubernetes.serverVersion)
                    : null,
                ),
                kubernetes?.available && (kubernetes.contexts ?? []).length > 0
                  ? h(
                      'div',
                      { className: 'dsm-context-row' },
                      h('span', { className: 'dsm-context-label' }, t('context')),
                      h(
                        'select',
                        {
                          className: 'dsm-select',
                          value: kubernetes.context ?? '',
                          'aria-label': t('switchContext'),
                          disabled: pending !== null && pending.startsWith('kube.context:'),
                          onChange: (event) =>
                            runControl('kube.context', event.target.value, `${t('switchContext')} → ${event.target.value}`),
                        },
                        ...(kubernetes.contexts ?? []).map((name) => h('option', { key: name, value: name }, name)),
                      ),
                    )
                  : null,
                kubernetes?.connected
                  ? h(
                      'div',
                      { className: 'dsm-stats dsm-stats-3' },
                      h(Stat, { label: t('nodePlural'), value: `${kubernetes.nodesReady ?? 0} / ${kubernetes.nodesTotal ?? 0}` }),
                      h(Stat, { label: t('pods'), value: `${kubernetes.pods?.running ?? 0} / ${kubernetes.pods?.total ?? 0}` }),
                      h(Stat, { label: t('deployments'), value: `${kubernetes.deployments?.active ?? 0}` }),
                      h(Stat, {
                        label: t('restarts'),
                        value: String(kubernetes.pods?.restarts ?? 0),
                        tone: (kubernetes.pods?.restarts ?? 0) > 50 ? 'warn' : undefined,
                      }),
                      h(Stat, { label: t('namespaces'), value: String(kubernetes.namespaces ?? 0) }),
                      h(Stat, {
                        label: t('degraded'),
                        value: String(kubernetes.deployments?.degraded ?? 0),
                        tone: (kubernetes.deployments?.degraded ?? 0) > 0 ? 'warn' : undefined,
                      }),
                    )
                  : null,
                kubernetes?.connected
                  ? h('div', { className: 'dsm-dense' }, h(PhaseBar, { pods: kubernetes.pods ?? {}, t }))
                  : null,
                kubernetes?.connected && (kubernetes.nodes ?? []).length > 0
                  ? h(
                      'div',
                      { className: 'dsm-subblock' },
                      ...(kubernetes.nodes ?? []).map((node) =>
                        h(
                          'div',
                          { key: node.name, className: 'dsm-node' },
                          h('span', { className: 'dsm-node-name' }, node.name),
                          h(
                            'span',
                            { className: `dsm-node-state${node.ready ? '' : ' dsm-node-state-bad'}` },
                            node.ready ? t('ready') : t('notReady'),
                          ),
                          h('span', { className: 'dsm-node-meta' }, `${node.version} · ${node.cpu ?? '?'} vCPU · ${formatBytes(node.memory ?? 0)} · ${node.address || '—'}`),
                        ),
                      ),
                    )
                  : null,
                kubernetes?.connected
                  ? h(
                      'div',
                      { className: 'dsm-subblock' },
                      h('h4', { className: 'dsm-sub-title' }, t('degradedDeployments')),
                      (kubernetes.deployments?.list ?? []).filter((deployment) => deployment.ready < deployment.desired).length === 0
                        ? h('p', { className: 'dsm-empty' }, t('allDeploymentsHealthy'))
                        : h(
                            'div',
                            { className: 'dsm-rows' },
                            ...(kubernetes.deployments?.list ?? [])
                              .filter((deployment) => deployment.ready < deployment.desired)
                              .slice(0, 6)
                              .map((deployment) =>
                                h(
                                  'div',
                                  { key: deployment.id, className: 'dsm-row dsm-row-action' },
                                  h(
                                    'dt',
                                    { title: deployment.id },
                                    h('span', { className: 'dsm-mono' }, deployment.name),
                                    h('span', { className: 'dsm-dim' }, deployment.namespace),
                                  ),
                                  h(
                                    'dd',
                                    null,
                                    h('span', { className: 'dsm-ratio dsm-ratio-bad' }, `${deployment.ready}/${deployment.desired}`),
                                    h(ActionButton, {
                                      icon: 'restart',
                                      label: `${t('rolloutRestart')} ${deployment.name}`,
                                      confirmLabel: t('confirm'),
                                      disabled: pending?.endsWith(`:${deployment.id}`),
                                      onRun: () => runControl('kube.restart', deployment.id, `${t('rolloutRestart')} ${deployment.name}`),
                                    }),
                                  ),
                                ),
                              ),
                          ),
                      (kubernetes.blocked ?? []).length > 0
                        ? h(
                            'div',
                            { className: 'dsm-rows dsm-rows-tight' },
                            ...(kubernetes.blocked ?? []).slice(0, 4).map((pod) =>
                              h(
                                'div',
                                { key: `${pod.namespace}/${pod.name}`, className: 'dsm-row' },
                                h('dt', { title: pod.name }, h('span', { className: 'dsm-mono' }, pod.name)),
                                h('dd', null, h('span', { className: 'dsm-reason' }, pod.reason), ` · ${pod.restarts} ↻`),
                              ),
                            ),
                          )
                        : null,
                    )
                  : null,
                kubernetes?.connected && (kubernetes.events ?? []).length > 0
                  ? h(
                      'div',
                      { className: 'dsm-subblock' },
                      h('h4', { className: 'dsm-sub-title' }, t('recentWarnings')),
                      ...(kubernetes.events ?? []).slice(0, 4).map((event, index) =>
                        h(
                          'div',
                          { key: `${event.object}-${index}`, className: 'dsm-event', title: event.message },
                          h('span', { className: 'dsm-event-reason' }, event.reason),
                          h('span', { className: 'dsm-event-object' }, event.object),
                          h('span', { className: 'dsm-event-count' }, `×${event.count}`),
                          h('span', { className: 'dsm-event-text' }, event.message),
                        ),
                      ),
                    )
                  : null,
              ),

              /* ----------------------------------------------- devspace */
              h(
                'article',
                { className: 'dsm-card dsm-infra', style: { order: 4, '--a1': '#f472b6', '--a2': '#ec4899' } },
                h(
                  'header',
                  { className: 'dsm-card-head' },
                  h('span', { className: 'dsm-glow-dot' }),
                  h('h3', null, t('devspace')),
                  h(
                    Pill,
                    { tone: devspace?.available ? (devspace.sessions?.length > 0 ? 'ok' : 'idle') : 'off' },
                    devspace?.available
                      ? `${devspace.sessions?.length ?? 0} ${t('session')}${(devspace.sessions?.length ?? 0) > 1 ? 's' : ''}`
                      : t('notInstalled'),
                  ),
                  h('span', { className: 'dsm-head-spacer' }),
                  devspace?.version ? h('span', { className: 'dsm-badge' }, `v${devspace.version}`) : null,
                ),
                devspace?.available
                  ? h(
                      'div',
                      { className: 'dsm-stats dsm-stats-2' },
                      h(Stat, { label: t('sessions'), value: String(devspace.sessions?.length ?? 0) }),
                      h(Stat, { label: t('plugins'), value: String(devspace.plugins?.length ?? 0) }),
                    )
                  : null,
                devspace?.available && (devspace.sessions ?? []).length > 0
                  ? h(
                      'div',
                      { className: 'dsm-sessions' },
                      ...(devspace.sessions ?? []).map((session) =>
                        h(
                          'div',
                          { key: session.pid, className: 'dsm-session' },
                          h(
                            'div',
                            { className: 'dsm-session-head' },
                            h('strong', null, session.project ?? session.command),
                            h(ActionButton, {
                              icon: 'stop',
                              tone: 'danger',
                              label: `${t('stopSession')} (${session.pid})`,
                              confirmLabel: t('confirm'),
                              disabled: pending?.endsWith(`:${session.pid}`),
                              onRun: () => runControl('devspace.stop', String(session.pid), `${t('stopSession')} ${session.project ?? session.pid}`),
                            }),
                          ),
                          h('span', { className: 'dsm-session-meta' }, `${session.mode} · pid ${session.pid}`),
                          session.dependencies?.length
                            ? h('span', { className: 'dsm-session-meta' }, `${t('dependencies')} ${session.dependencies.join(', ')}`)
                            : null,
                          session.cwd ? h('span', { className: 'dsm-session-path' }, session.cwd) : null,
                        ),
                      ),
                    )
                  : devspace?.available
                    ? h('p', { className: 'dsm-empty' }, t('none'))
                    : null,
                devspace?.available && (devspace.plugins ?? []).length > 0
                  ? h(
                      'div',
                      { className: 'dsm-subblock' },
                      h('h4', { className: 'dsm-sub-title' }, t('installedPlugins')),
                      ...(devspace.plugins ?? []).map((plugin) =>
                        h(
                          'div',
                          { key: plugin.name, className: 'dsm-plugin' },
                          h('span', { className: 'dsm-mono' }, plugin.name),
                          h('span', { className: 'dsm-dim' }, [plugin.version, `${plugin.commands} cmd`, `${plugin.vars} vars`].filter(Boolean).join(' · ')),
                        ),
                      ),
                    )
                  : null,
              ),
            ),

            /* --------------------------------------- bottom: chart · processes */
            h(
              'section',
              { className: 'dsm-bottom' },
              h(
                'article',
                { className: 'dsm-card dsm-panel' },
                h(
                  'header',
                  { className: 'dsm-panel-head' },
                  h(
                    'div',
                    null,
                    h('h2', null, t('chartTitle')),
                    h('p', null, `${t('sampleRange')} ${windowed.length} ${t('samples')} · ${t('chartHint')}`),
                  ),
                  h(
                    'div',
                    { className: 'dsm-tabs', role: 'tablist' },
                    ...[
                      ['cpu', t('cpu')],
                      ['memory', t('memory')],
                      ['network', t('network')],
                      ['disk', t('disk')],
                    ].map(([key, label]) =>
                      h(
                        'button',
                        {
                          key,
                          type: 'button',
                          role: 'tab',
                          'aria-selected': metric === key,
                          className: `dsm-tab${metric === key ? ' dsm-tab-active' : ''}`,
                          onClick: () => setMetric(key),
                        },
                        label,
                      ),
                    ),
                  ),
                ),
                h(AreaChart, {
                  samples: windowed,
                  series: chartSeries,
                  formatValue: chartFormatter,
                  t,
                }),
                h(
                  'footer',
                  { className: 'dsm-panel-foot' },
                  h(
                    'div',
                    { className: 'dsm-ranges' },
                    ...[30, 90, 180].map((count) =>
                      h(
                        'button',
                        {
                          key: count,
                          type: 'button',
                          className: `dsm-range${range === count ? ' dsm-range-active' : ''}`,
                          onClick: () => setRange(count),
                        },
                        count === 30 ? t('range1') : count === 90 ? t('range3') : t('range6'),
                      ),
                    ),
                  ),
                  h('span', { className: 'dsm-foot-note' }, t('readOnly')),
                ),
              ),
              processes.length > 0
                ? h(
                    'article',
                    { className: 'dsm-card dsm-table-card' },
                    h(
                      'header',
                      { className: 'dsm-card-head' },
                      h('span', { className: 'dsm-glow-dot', style: { '--a1': '#a78bfa', '--a2': '#22d3ee' } }),
                      h('h3', null, t('processesTable')),
                    ),
                    h(
                      'div',
                      { className: 'dsm-proc-list' },
                      ...processes.slice(0, 8).map((process, index) =>
                        h(
                          'div',
                          { key: `${process.name}-${index}`, className: 'dsm-proc-row' },
                          h('span', { className: 'dsm-proc-rank' }, String(index + 1).padStart(2, '0')),
                          h('span', { className: 'dsm-proc-name' }, process.name),
                          h(Meter, { value: Math.min(100, process.cpu * 2), from: '#a78bfa', to: '#22d3ee', height: 3 }),
                          h('b', { className: 'dsm-proc-cpu' }, `${process.cpu.toFixed(1)}%`),
                          h('span', { className: 'dsm-proc-mem' }, formatBytes(process.rss ?? 0)),
                        ),
                      ),
                    ),
                  )
                : null,
            ),

            ],

            h(
              'footer',
              { className: 'dsm-footer' },
              h('span', null, `system-monitor · ${onJira ? 'jira' : t('live')}`),
              h('span', null, onJira ? (jira?.jql ?? '') : `poll ${(data?.config?.fastMs ?? 2000) / 1000} s`),
            ),
          ),
        ),
      );
    }

    /* ---------------------------------------------------------- data layer */

    /**
     * Owns polling, the manual refresh, and tab-visibility pausing; the view
     * below is pure so it can be rendered from any snapshot.
     */
    function SystemPage(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const [state, setState] = useState({ status: 'loading', data: null, error: null, at: 0 });
      const [refreshing, setRefreshing] = useState(false);
      const [hidden, setHidden] = useState(false);

      const apply = useCallback((data) => {
        setState({ status: 'ready', data, error: null, at: Date.now() });
      }, []);

      const fail = useCallback((error) => {
        setState((previous) => ({
          status: previous.data ? 'stale' : 'error',
          data: previous.data,
          error: error instanceof Error ? error.message : String(error),
          at: previous.at,
        }));
      }, []);

      useEffect(() => {
        let cancelled = false;
        let timer = null;
        const tick = async () => {
          if (cancelled) return;
          if (document.hidden) {
            timer = setTimeout(tick, POLL_MS);
            return;
          }
          try {
            const response = await fetch(new URL(SNAPSHOT_ROUTE, document.baseURI), {
              headers: { accept: 'application/json' },
              cache: 'no-store',
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!cancelled) apply(data);
          } catch (error) {
            if (!cancelled) fail(error);
          } finally {
            if (!cancelled) timer = setTimeout(tick, POLL_MS);
          }
        };
        tick();
        return () => {
          cancelled = true;
          if (timer) clearTimeout(timer);
        };
      }, [apply, fail]);

      useEffect(() => {
        const onVisibility = () => setHidden(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
      }, []);

      const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
          const response = await fetch(new URL(REFRESH_ROUTE, document.baseURI), {
            method: 'POST',
            headers: { accept: 'application/json' },
            cache: 'no-store',
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          apply(await response.json());
        } catch (error) {
          fail(error);
        } finally {
          setRefreshing(false);
        }
      }, [apply, fail]);

      return h(DashboardView, {
        data: state.data,
        status: state.status,
        error: state.error,
        at: state.at,
        refreshing,
        onRefresh: refresh,
        onSnapshot: apply,
        hidden,
        t,
      });
    }

    /* ------------------------------------------------------------ fallback */

    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error, info) {
        // A thrown component blanks the whole slot, so keep the failure local.
        console.error('[system-monitor] panel crashed', error, info);
      }
      render() {
        if (this.state.error) {
          return h(
            'div',
            { className: 'dsm-root dsm-fallback' },
            h('style', null, CSS),
            h('h2', null, this.props.t ? this.props.t('fallbackError') : 'This panel could not be rendered.'),
            h('pre', null, String(this.state.error?.message ?? this.state.error)),
            h('p', null, this.props.t ? this.props.t('reload') : 'Close and reopen the panel to try again.'),
          );
        }
        return this.props.children;
      }
    }

    /* ---------------------------------------------------------------- icon */

    function PanelIcon(props) {
      const size = props?.size ?? 18;
      const active = Boolean(props?.active);
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: 'none',
          'aria-hidden': 'true',
          style: { display: 'block' },
        },
        h('path', {
          d: 'M3 15a2.5 2.5 0 0 0 2.5 2.5h13A2.5 2.5 0 0 0 21 15V8.5A2.5 2.5 0 0 0 18.5 6h-13A2.5 2.5 0 0 0 3 8.5Z',
          stroke: 'currentColor',
          strokeWidth: active ? 1.9 : 1.6,
          strokeLinejoin: 'round',
          opacity: active ? 1 : 0.72,
        }),
        h('path', {
          d: 'M6 21h12M12 17.5V21',
          stroke: 'currentColor',
          strokeWidth: active ? 1.9 : 1.6,
          strokeLinecap: 'round',
          opacity: active ? 1 : 0.72,
        }),
        h('path', {
          d: 'M6.6 13.4v-2.2M9.4 13.4V9.2M12.2 13.4v-3.6M15 13.4v-2M17.8 13.4v-1.2',
          stroke: active ? 'currentColor' : 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          opacity: active ? 0.95 : 0.5,
        }),
      );
    }

    /* ----------------------------------------------------------------- css */

    const CSS = `
.dsm-root{
  --dsm-track: rgba(15,23,42,.12);
  --dsm-grid: rgba(15,23,42,.07);
  --dsm-card-bg: linear-gradient(165deg, rgba(255,255,255,.92), rgba(255,255,255,.66));
  --dsm-card-border: rgba(15,23,42,.09);
  --dsm-card-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 18px 44px -28px rgba(15,23,42,.45);
  --dsm-ink: var(--dsw-alias-label-primary, #0f172a);
  --dsm-ink-2: var(--dsw-alias-label-secondary, #475569);
  --dsm-ink-3: var(--dsw-alias-label-tertiary, #64748b);
  --dsm-hair: rgba(15,23,42,.06);
  --dsm-hover: rgba(15,23,42,.04);
  --dsm-sheen: rgba(255,255,255,.9);
  position:relative;height:100%;overflow:hidden;color:var(--dsm-ink);
  font-family:var(--dsw-font-family-text, ui-sans-serif, system-ui, -apple-system, "SF Pro Text", sans-serif);
  background:var(--dsw-alias-bg-base, #f6f7fb);
}
body[data-ds-dark-theme] .dsm-root{
  --dsm-track: rgba(255,255,255,.10);
  --dsm-grid: rgba(255,255,255,.06);
  --dsm-card-bg: linear-gradient(165deg, rgba(255,255,255,.085), rgba(255,255,255,.028));
  --dsm-card-border: rgba(255,255,255,.09);
  --dsm-card-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 24px 60px -32px rgba(0,0,0,.9);
  --dsm-hair: rgba(255,255,255,.06);
  --dsm-hover: rgba(255,255,255,.05);
  --dsm-sheen: rgba(255,255,255,.08);
  --dsm-ink: var(--dsw-alias-label-primary, #f1f5f9);
  --dsm-ink-2: var(--dsw-alias-label-secondary, #c3ccdb);
  --dsm-ink-3: var(--dsw-alias-label-tertiary, #8b97a8);
  background:#080a10;
}
.dsm-root *{box-sizing:border-box}
.dsm-aurora{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.dsm-aurora i{position:absolute;display:block;border-radius:50%;filter:blur(64px);opacity:.55;will-change:transform}
.dsm-aurora i:nth-child(1){width:44vw;height:44vw;left:-8vw;top:-14vw;background:radial-gradient(circle at 30% 30%, #818cf8, transparent 68%);animation:dsm-drift-a 26s ease-in-out infinite}
.dsm-aurora i:nth-child(2){width:38vw;height:38vw;right:-6vw;top:-4vw;background:radial-gradient(circle at 60% 40%, #22d3ee, transparent 66%);opacity:.42;animation:dsm-drift-b 32s ease-in-out infinite}
.dsm-aurora i:nth-child(3){width:42vw;height:30vw;left:22vw;top:32vh;background:radial-gradient(circle at 50% 50%, #f472b6, transparent 70%);opacity:.3;animation:dsm-drift-c 38s ease-in-out infinite}
body[data-ds-dark-theme] .dsm-aurora i{opacity:.34}
body[data-ds-dark-theme] .dsm-aurora i:nth-child(3){opacity:.22}
.dsm-texture{position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.5;
  background-image:linear-gradient(var(--dsm-hair) 1px, transparent 1px),linear-gradient(90deg, var(--dsm-hair) 1px, transparent 1px);
  background-size:44px 44px;
  mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 78%);
  -webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 78%)}
@keyframes dsm-drift-a{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(6vw,4vh,0) scale(1.12)}}
@keyframes dsm-drift-b{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-5vw,6vh,0) scale(1.08)}}
@keyframes dsm-drift-c{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-4vw,-5vh,0) scale(1.15)}}
.dsm-scroll{position:relative;z-index:1;height:100%;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}
.dsm-content{width:100%;margin:0;padding:calc(var(--dsh-frame-top-clearance, 0px) + 30px) clamp(20px, 2.4vw, 44px) 56px;
  display:flex;flex-direction:column;gap:20px}
.dsm-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:6px 4px 2px}
.dsm-hero-main{min-width:0}
.dsm-eyebrow{display:flex;align-items:center;gap:9px;font-size:11px;font-weight:650;letter-spacing:.16em;text-transform:uppercase;color:var(--dsm-ink-3)}
.dsm-eyebrow-state{background:linear-gradient(90deg,#22d3ee,#818cf8 45%,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent}
.dsm-sep{opacity:.35}
.dsm-live{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 0 0 rgba(52,211,153,.55);animation:dsm-pulse 2.4s ease-out infinite}
.dsm-live-idle{background:#f59e0b;animation:none;box-shadow:none}
@keyframes dsm-pulse{0%{box-shadow:0 0 0 0 rgba(52,211,153,.5)}70%{box-shadow:0 0 0 9px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}
.dsm-title{margin:9px 0 0;font-size:clamp(26px,3vw,36px);line-height:1.08;font-weight:680;letter-spacing:-.028em;
  background:linear-gradient(120deg, var(--dsm-ink) 28%, #818cf8 68%, #22d3ee 96%);-webkit-background-clip:text;background-clip:text;color:transparent}
body[data-ds-dark-theme] .dsm-title{background:linear-gradient(120deg,#f8fafc 24%,#a5b4fc 66%,#67e8f9 96%);-webkit-background-clip:text;background-clip:text;color:transparent}
.dsm-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}
.dsm-chip{font-size:11.5px;font-weight:560;padding:4.5px 10px;border-radius:999px;color:var(--dsm-ink-2);
  border:1px solid var(--dsm-card-border);background:rgba(255,255,255,.5);backdrop-filter:blur(14px) saturate(160%)}
body[data-ds-dark-theme] .dsm-chip{background:rgba(255,255,255,.045)}
.dsm-chip-quiet{color:var(--dsm-ink-3);background:transparent}
.dsm-hero-side{display:flex;align-items:center;gap:12px;flex:none;padding-bottom:5px}
.dsm-stamp{display:flex;flex-direction:column;align-items:flex-end;gap:2px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--dsm-ink-3)}
.dsm-stamp b{font-size:13px;letter-spacing:0;text-transform:none;font-variant-numeric:tabular-nums;color:var(--dsm-ink)}
.dsm-refresh{width:36px;height:36px;display:grid;place-items:center;border-radius:12px;cursor:pointer;color:var(--dsm-ink-2);
  border:1px solid var(--dsm-card-border);background:var(--dsm-card-bg);transition:transform .25s cubic-bezier(.22,1,.36,1),color .2s,box-shadow .2s}
.dsm-refresh:hover{color:var(--dsm-ink);box-shadow:0 8px 24px -14px rgba(99,102,241,.8);transform:translateY(-1px)}
.dsm-refresh:disabled{opacity:.6;cursor:progress}
.dsm-refresh-busy svg{animation:dsm-spin 1s linear infinite}
@keyframes dsm-spin{to{transform:rotate(360deg)}}
.dsm-banner{display:flex;gap:10px;align-items:baseline;padding:11px 15px;border-radius:14px;font-size:12.5px;
  border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.09);color:#ef4444}
.dsm-banner-warn{border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.1);color:#f59e0b}
.dsm-banner strong{font-weight:650}
.dsm-card{position:relative;border-radius:22px;border:1px solid var(--dsm-card-border);background:var(--dsm-card-bg);
  box-shadow:var(--dsm-card-shadow);backdrop-filter:blur(22px) saturate(170%);overflow:hidden}
.dsm-card::before{content:"";position:absolute;inset:0 0 auto;height:1px;background:linear-gradient(90deg,transparent,var(--dsm-sheen),transparent);pointer-events:none}
.dsm-vitals{display:grid;grid-template-columns:repeat(auto-fit,minmax(238px,1fr));gap:16px}
@media (min-width:1080px){.dsm-vitals{grid-template-columns:repeat(4,minmax(0,1fr))}}
.dsm-vital{padding:16px 17px 14px;display:flex;flex-direction:column;gap:12px;
  transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s,border-color .35s}
.dsm-vital:hover{transform:translateY(-2px);border-color:color-mix(in srgb, var(--a2) 32%, transparent);
  box-shadow:var(--dsm-card-shadow),0 22px 48px -30px color-mix(in srgb, var(--a2) 60%, transparent)}
.dsm-vital::after{content:"";position:absolute;inset:-40% 55% auto -30%;height:150px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle at 50% 50%, var(--a1), transparent 70%);opacity:.18;filter:blur(26px)}
body[data-ds-dark-theme] .dsm-vital::after{opacity:.26}
.dsm-card-head{display:flex;align-items:center;gap:9px;position:relative;z-index:1}
.dsm-card-head h3{margin:0;font-size:12.5px;font-weight:640;letter-spacing:.01em;color:var(--dsm-ink-2)}
.dsm-glow-dot{width:8px;height:8px;border-radius:50%;flex:none;background:linear-gradient(140deg,var(--a1),var(--a2));
  box-shadow:0 0 12px -1px var(--a1)}
.dsm-badge{margin-left:auto;font-size:10.5px;font-weight:600;letter-spacing:.04em;color:var(--dsm-ink-3);
  padding:2.5px 8px;border-radius:99px;background:var(--dsm-hover);white-space:nowrap;max-width:52%;overflow:hidden;text-overflow:ellipsis}
.dsm-vital-body{display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;z-index:1}
.dsm-vital-figure{flex:1 1 auto;min-width:0}
.dsm-value{font-size:33px;line-height:1.05;font-weight:660;letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap;
  background:linear-gradient(120deg,var(--a1),var(--a2));-webkit-background-clip:text;background-clip:text;color:transparent}
.dsm-unit{font-size:15px;font-weight:600;letter-spacing:-.01em;margin-left:2px;opacity:.85}
.dsm-hint{margin:7px 0 0;font-size:11.5px;line-height:1.35;color:var(--dsm-ink-3);font-variant-numeric:tabular-nums;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px}
.dsm-donut{position:relative;flex:0 0 auto}
.dsm-donut svg{display:block;overflow:visible}
.dsm-donut-caption{position:absolute;inset:0;display:grid;place-content:center;text-align:center;gap:1px}
.dsm-donut-caption strong{font-size:12px;font-variant-numeric:tabular-nums}
.dsm-vital-stack{display:flex;flex-direction:column;gap:9px;margin-top:auto;position:relative;z-index:1}
.dsm-spark{display:block;width:100%;overflow:visible}
.dsm-spark-empty{opacity:.35}
.dsm-spark path[stroke]{filter:drop-shadow(0 2px 6px color-mix(in srgb, var(--a2) 45%, transparent))}
.dsm-cores{display:flex;gap:2px;align-items:flex-end;height:24px;padding-top:2px}
.dsm-core{flex:1;height:100%;display:flex;align-items:flex-end;border-radius:3px;background:var(--dsm-track);overflow:hidden}
.dsm-core i{display:block;width:100%;border-radius:2px;background:linear-gradient(180deg,#7c9cff,#22d3ee);
  transition:height 600ms cubic-bezier(.22,1,.36,1)}
.dsm-stacked{display:flex;height:5px;border-radius:99px;overflow:hidden;background:var(--dsm-track);gap:1px}
.dsm-stacked-part{height:100%;transition:width 600ms cubic-bezier(.22,1,.36,1)}
.dsm-swap{display:flex;justify-content:space-between;align-items:baseline;font-size:11px;color:var(--dsm-ink-3);font-variant-numeric:tabular-nums}
.dsm-swap b{color:#f472b6;font-weight:620}
.dsm-mounts{display:flex;flex-direction:column;gap:7px}
.dsm-mount{display:flex;flex-direction:column;gap:4px}
.dsm-mount-name{display:flex;justify-content:space-between;gap:8px;font-size:10.5px;color:var(--dsm-ink-3);font-variant-numeric:tabular-nums}
.dsm-mount-name em{font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-mount-name b{font-weight:640;color:var(--dsm-ink-2);flex:none}
.dsm-meter{display:block;width:100%;border-radius:99px;background:var(--dsm-track);overflow:hidden}
.dsm-meter-fill{display:block;height:100%;border-radius:99px;transition:width 600ms cubic-bezier(.22,1,.36,1)}
.dsm-net-totals{display:flex;flex-direction:column;gap:8px;flex:0 0 auto;align-items:flex-end}
.dsm-net-total{display:flex;align-items:baseline;gap:6px;font-variant-numeric:tabular-nums}
.dsm-net-arrow{font-size:12px;color:#34d399;font-weight:700}
.dsm-net-arrow-up{color:#a78bfa}
.dsm-net-total b{font-size:13px;font-weight:640}
.dsm-net-total small{font-size:10px;color:var(--dsm-ink-3);letter-spacing:.02em}
.dsm-battery{display:flex;align-items:center;gap:7px;font-size:10.5px;color:var(--dsm-ink-3);font-variant-numeric:tabular-nums}
.dsm-battery-gauge{width:20px;height:9px;border-radius:3px;border:1px solid currentColor;position:relative;opacity:.7}
.dsm-battery-gauge::after{content:"";position:absolute;inset:1.5px;border-radius:1.5px;background:#34d399;width:65%}
.dsm-battery-charging::after{background:#22d3ee;box-shadow:0 0 8px #22d3ee}
.dsm-panel{padding:18px 20px 14px;display:flex;flex-direction:column;gap:14px}
@media (min-width:1400px){.dsm-chart{height:240px}}
@media (min-width:1800px){.dsm-chart{height:280px}}
.dsm-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap}
.dsm-panel-head h2{margin:0;font-size:15px;font-weight:650;letter-spacing:-.01em}
.dsm-panel-head p{margin:5px 0 0;font-size:11.5px;color:var(--dsm-ink-3)}
.dsm-tabs{display:flex;gap:3px;padding:3px;border-radius:12px;background:var(--dsm-hover);flex-wrap:wrap}
.dsm-tab{border:0;background:transparent;cursor:pointer;font:inherit;font-size:11.5px;font-weight:600;color:var(--dsm-ink-3);
  padding:6px 12px;border-radius:9px;transition:color .18s,background .18s,box-shadow .18s}
.dsm-tab:hover{color:var(--dsm-ink)}
.dsm-tab-active{color:var(--dsm-ink);background:var(--dsm-card-bg);box-shadow:0 1px 0 var(--dsm-sheen) inset,0 2px 8px -4px rgba(15,23,42,.4)}
.dsm-chart-wrap{display:flex;flex-direction:column;gap:12px}
.dsm-chart{position:relative;height:190px;cursor:crosshair}
.dsm-chart-svg{display:block;width:100%;height:100%;overflow:visible}
.dsm-chart-empty{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--dsm-ink-3);font-size:12px;height:190px}
.dsm-chart-empty p{margin:0}
.dsm-pulse{width:8px;height:8px;border-radius:50%;background:#22d3ee;animation:dsm-pulse 1.8s ease-out infinite}
.dsm-now-dot{position:absolute;right:-2px;width:8px;height:8px;border-radius:50%;pointer-events:none;
  box-shadow:0 0 0 3px color-mix(in srgb, currentColor 22%, transparent),0 0 14px currentColor;
  animation:dsm-now 2.6s ease-in-out infinite}
@keyframes dsm-now{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
.dsm-crosshair{position:absolute;top:0;bottom:0;width:1px;background:linear-gradient(180deg,transparent,color-mix(in srgb,#818cf8 70%,transparent),transparent);pointer-events:none}
.dsm-tooltip{position:absolute;top:6px;transform:translateX(-50%);pointer-events:none;z-index:2;
  padding:8px 10px;border-radius:11px;min-width:112px;display:flex;flex-direction:column;gap:4px;
  border:1px solid var(--dsm-card-border);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 88%, transparent);
  backdrop-filter:blur(18px) saturate(180%);box-shadow:0 16px 40px -22px rgba(15,23,42,.7)}
.dsm-tooltip-left{transform:translateX(-106%)}
.dsm-tooltip-time{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsm-ink-3);font-variant-numeric:tabular-nums}
.dsm-tooltip-row{display:flex;align-items:center;gap:6px;font-size:11.5px}
.dsm-tooltip-row i{width:7px;height:7px;border-radius:2px;flex:none}
.dsm-tooltip-row em{font-style:normal;color:var(--dsm-ink-3)}
.dsm-tooltip-row b{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:640}
.dsm-axis{display:flex;flex-wrap:wrap;gap:8px 22px}
.dsm-axis-row{display:flex;align-items:baseline;gap:9px;font-variant-numeric:tabular-nums;min-width:0}
.dsm-axis-k{font-size:10.5px;font-weight:640;letter-spacing:.06em;text-transform:uppercase;color:var(--dsm-ink-3)}
.dsm-axis-v{font-size:15px;font-weight:660;letter-spacing:-.02em}
.dsm-axis-stats{display:flex;align-items:baseline;gap:5px;font-size:10.5px;color:var(--dsm-ink-3)}
.dsm-axis-stats b{color:var(--dsm-ink-2);font-weight:600}
.dsm-panel-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--dsm-hair)}
.dsm-ranges{display:flex;gap:2px}
.dsm-range{border:0;background:transparent;font:inherit;font-size:11px;font-weight:600;color:var(--dsm-ink-3);cursor:pointer;
  padding:4px 9px;border-radius:8px;transition:background .16s,color .16s}
.dsm-range:hover{color:var(--dsm-ink);background:var(--dsm-hover)}
.dsm-range-active{color:#818cf8;background:rgba(129,140,248,.13)}
.dsm-foot-note{font-size:10.5px;color:var(--dsm-ink-3)}
.dsm-infra-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(258px,1fr));gap:16px}
@media (min-width:900px){.dsm-infra-grid{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}}
.dsm-infra-grid>.dsm-docker{grid-column:auto}
.dsm-infra{padding:16px 17px;display:flex;flex-direction:column;gap:11px}
.dsm-infra-status{position:relative;z-index:1}
.dsm-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:620;padding:4px 10px;border-radius:99px;
  border:1px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.dsm-pill i{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none;box-shadow:0 0 8px currentColor}
.dsm-pill-ok{color:#10b981;background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.24)}
.dsm-pill-warn{color:#f59e0b;background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.26)}
.dsm-pill-idle{color:var(--dsm-ink-3);background:var(--dsm-hover);border-color:var(--dsm-card-border)}
.dsm-pill-off{color:#ef4444;background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.22)}
.dsm-rows{display:flex;flex-direction:column;gap:6px;margin:0;position:relative;z-index:1}
.dsm-rows-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 22px}
@media (max-width:520px){.dsm-rows-cols{grid-template-columns:minmax(0,1fr)}}
.dsm-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:11.5px}
.dsm-row dt{color:var(--dsm-ink-3);flex:none}
.dsm-row dd{margin:0;font-weight:600;font-variant-numeric:tabular-nums;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-mini-list{display:flex;flex-direction:column;gap:7px;padding-top:9px;border-top:1px solid var(--dsm-hair)}
.dsm-mini-row{display:flex;align-items:center;gap:8px;font-size:11px;min-width:0}
.dsm-mini-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsm-ink-2);font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:10.5px}
.dsm-mini-row .dsm-meter{width:48px;flex:none}
.dsm-mini-row b{font-variant-numeric:tabular-nums;font-weight:620;font-size:10.5px;min-width:40px;text-align:right}
.dsm-mini-tag{font-size:10px;color:var(--dsm-ink-3);font-variant-numeric:tabular-nums;white-space:nowrap}
.dsm-sessions{display:flex;flex-direction:column;gap:8px;padding-top:9px;border-top:1px solid var(--dsm-hair)}
.dsm-session{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:11px;background:var(--dsm-hover);
  border-left:2px solid #f472b6}
.dsm-session strong{font-size:11.5px;font-weight:640;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-session span{font-size:10.5px;color:var(--dsm-ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-empty{margin:6px 0 0;font-size:11.5px;color:var(--dsm-ink-3)}
.dsm-tables{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px}
@media (min-width:1180px){.dsm-tables{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}}
@media (min-width:1180px){.dsm-tables>.dsm-table-card:only-child{grid-column:1 / -1}}
.dsm-table-card{padding:16px 17px;display:flex;flex-direction:column;gap:12px}
.dsm-table-scroll{overflow-x:auto;margin:0 -4px;padding:0 4px}
.dsm-table{width:100%;border-collapse:collapse;font-size:11.5px}
.dsm-table th{text-align:left;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--dsm-ink-3);
  font-weight:640;padding:0 8px 7px 0;border-bottom:1px solid var(--dsm-hair);white-space:nowrap}
.dsm-table td{padding:7px 8px 7px 0;border-bottom:1px solid var(--dsm-hair);vertical-align:middle}
.dsm-table tr:last-child td{border-bottom:0}
.dsm-table tbody tr{transition:background .15s}
.dsm-table tbody tr:hover{background:var(--dsm-hover)}
.dsm-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.dsm-cell-name{display:block;font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:11px;font-weight:600;
  max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-cell-sub{display:block;font-size:10px;color:var(--dsm-ink-3);max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-state{font-size:10px;font-weight:640;padding:2px 7px;border-radius:99px;letter-spacing:.02em}
.dsm-state-ok{color:#10b981;background:rgba(16,185,129,.12)}
.dsm-state-idle{color:var(--dsm-ink-3);background:var(--dsm-hover)}
.dsm-proc-list{display:flex;flex-direction:column;gap:2px}
.dsm-proc-row{display:grid;grid-template-columns:22px minmax(0,1fr) 54px 52px 58px;align-items:center;gap:9px;
  padding:6px 6px;border-radius:9px;font-size:11.5px;transition:background .15s}
.dsm-proc-row:hover{background:var(--dsm-hover)}
.dsm-proc-rank{font-size:9.5px;color:var(--dsm-ink-3);font-variant-numeric:tabular-nums}
.dsm-proc-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:10.5px}
.dsm-proc-cpu{text-align:right;font-variant-numeric:tabular-nums;font-weight:640}
.dsm-proc-mem{text-align:right;font-variant-numeric:tabular-nums;color:var(--dsm-ink-3);font-size:10.5px}
.dsm-footer{display:flex;justify-content:space-between;gap:14px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--dsm-ink-3);opacity:.8;padding:6px 4px 0}
.dsm-fallback{padding:40px;display:flex;flex-direction:column;gap:12px;overflow:auto}
.dsm-fallback h2{margin:0;font-size:18px}
.dsm-fallback pre{margin:0;padding:14px;border-radius:12px;background:rgba(239,68,68,.08);color:#ef4444;
  font-size:11.5px;white-space:pre-wrap;word-break:break-word}
.dsm-fallback p{margin:0;font-size:12px;color:var(--dsm-ink-3)}
@media (max-width:760px){
  .dsm-content{padding:calc(var(--dsh-frame-top-clearance, 0px) + 22px) 16px 44px}
  .dsm-hero{flex-direction:column;align-items:flex-start;gap:16px}
  .dsm-hero-side{align-self:stretch;justify-content:space-between}
  .dsm-proc-row{grid-template-columns:20px minmax(0,1fr) 44px 46px}
  .dsm-proc-mem{display:none}
  .dsm-chart{height:156px}
}
@media (prefers-reduced-motion:reduce){
  .dsm-aurora i{animation:none}
  .dsm-live,.dsm-pulse{animation:none}
  .dsm-refresh-busy svg{animation:none}
  .dsm-spark path[stroke]{filter:none}
  *{}
}

/* ---- infrastructure panels -------------------------------------------- */
.dsm-head-spacer{flex:1}
.dsm-docker{padding:18px 20px;display:flex;flex-direction:column;gap:14px}
.dsm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px}
.dsm-stats-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.dsm-stats-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.dsm-stat{display:flex;flex-direction:column;gap:3px;padding:8px 10px;border-radius:11px;
  background:var(--dsm-hover);border:1px solid var(--dsm-hair);min-width:0}
.dsm-stat-k{font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--dsm-ink-3);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsm-stat-v{font-size:14px;font-weight:640;letter-spacing:-.01em;font-variant-numeric:tabular-nums;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsm-stat-warn .dsm-stat-v{color:#f59e0b}
.dsm-table-actions td{padding-top:6px;padding-bottom:6px}
.dsm-ports-col{max-width:190px}
@media (max-width:1649px){.dsm-ports-col{display:none}}
.dsm-ports{display:block;font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:9.5px;
  color:var(--dsm-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsm-act-col{text-align:right;width:1%}
.dsm-act-row{display:flex;gap:4px;justify-content:flex-end}
.dsm-act-row-end{margin-left:auto}
.dsm-act{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:24px;min-width:24px;
  padding:0 6px;border-radius:8px;cursor:pointer;font:inherit;font-size:11px;font-weight:600;
  color:var(--dsm-ink-2);background:var(--dsm-hover);border:1px solid var(--dsm-hair);
  transition:background .16s,color .16s,border-color .16s,transform .16s}
.dsm-act:hover:not(:disabled){color:var(--dsm-ink);border-color:var(--dsm-card-border);transform:translateY(-1px)}
.dsm-act:disabled{opacity:.45;cursor:not-allowed}
.dsm-act-glyph{line-height:1}
.dsm-act-danger:hover:not(:disabled),.dsm-act-armed.dsm-act-danger{color:#ef4444;border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.12)}
.dsm-act-go:hover:not(:disabled),.dsm-act-armed.dsm-act-go{color:#10b981;border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.12)}
.dsm-act-armed{color:#f59e0b;border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.14)}
.dsm-act-text{font-size:10px;letter-spacing:.02em;white-space:nowrap}
.dsm-act-wide{height:27px;padding:0 11px;gap:5px}
.dsm-spin{width:11px;height:11px;border-radius:50%;border:1.6px solid currentColor;border-top-color:transparent;
  animation:dsm-spin .7s linear infinite}
.dsm-context-row{display:flex;align-items:center;gap:8px}
.dsm-context-label{font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--dsm-ink-3);flex:none}
.dsm-select{flex:1;min-width:0;font:inherit;font-size:11.5px;font-weight:600;color:var(--dsm-ink);
  background:var(--dsm-hover);border:1px solid var(--dsm-hair);border-radius:9px;padding:5px 8px;cursor:pointer}
.dsm-select:disabled{opacity:.55;cursor:progress}
.dsm-phases{display:flex;flex-direction:column;gap:6px}
.dsm-phase-bar{display:flex;height:6px;border-radius:99px;overflow:hidden;background:var(--dsm-track);gap:1px}
.dsm-phase-bar span{height:100%}
.dsm-phase-legend{display:flex;flex-wrap:wrap;gap:4px 12px}
.dsm-phase-item{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--dsm-ink-3);
  font-variant-numeric:tabular-nums}
.dsm-phase-item i{width:6px;height:6px;border-radius:2px}
.dsm-subblock{display:flex;flex-direction:column;gap:7px;padding-top:11px;border-top:1px solid var(--dsm-hair)}
.dsm-sub-title{margin:0;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--dsm-ink-3);font-weight:640}
.dsm-node{display:flex;align-items:baseline;gap:8px;font-size:11px;min-width:0}
.dsm-node-name{font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:10.5px;font-weight:600;flex:none}
.dsm-node-state{font-size:9.5px;font-weight:640;color:#10b981;background:rgba(16,185,129,.12);
  padding:1.5px 6px;border-radius:99px;flex:none}
.dsm-node-state-bad{color:#ef4444;background:rgba(239,68,68,.12)}
.dsm-node-meta{color:var(--dsm-ink-3);font-size:10px;font-variant-numeric:tabular-nums;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-row-action dd{display:flex;align-items:center;gap:6px;justify-content:flex-end}
.dsm-mono{font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:10.5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px}
.dsm-dim{color:var(--dsm-ink-3);font-size:10px;margin-left:6px}
.dsm-ratio{font-variant-numeric:tabular-nums;font-weight:640;font-size:10.5px}
.dsm-ratio-bad{color:#f59e0b}
.dsm-reason{color:#f59e0b;font-size:10px;font-weight:600}
.dsm-rows-tight{gap:4px}
.dsm-event{display:grid;grid-template-columns:auto auto auto minmax(0,1fr);gap:7px;align-items:baseline;font-size:10px}
.dsm-event-reason{color:#f59e0b;font-weight:640;white-space:nowrap}
.dsm-event-object{font-family:var(--dsw-font-family-code, ui-monospace, monospace);color:var(--dsm-ink-2);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.dsm-event-count{color:var(--dsm-ink-3);font-variant-numeric:tabular-nums}
.dsm-event-text{color:var(--dsm-ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-plugin{display:flex;justify-content:space-between;gap:10px;font-size:11px;min-width:0}
.dsm-session-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.dsm-session-meta{font-size:10px;color:var(--dsm-ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-session-path{font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:9.5px;
  color:var(--dsm-ink-3);opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-bottom{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px}
@media (min-width:1180px){.dsm-bottom{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}}
.dsm-bottom>:only-child{grid-column:1 / -1}
.dsm-toast{position:fixed;right:26px;bottom:26px;z-index:60;display:flex;align-items:center;gap:8px;
  padding:10px 14px;border-radius:13px;font-size:12px;font-weight:560;max-width:min(520px,70vw);
  border:1px solid var(--dsm-card-border);background:var(--dsm-card-bg);backdrop-filter:blur(20px) saturate(180%);
  box-shadow:0 20px 50px -24px rgba(15,23,42,.7);animation:dsm-toast-in .28s cubic-bezier(.22,1,.36,1)}
.dsm-toast-dot{width:7px;height:7px;border-radius:50%;flex:none;background:currentColor;box-shadow:0 0 10px currentColor}
.dsm-toast-ok{color:#10b981}
.dsm-toast-error{color:#ef4444}
@keyframes dsm-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (max-width:760px){.dsm-stats-3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (prefers-reduced-motion:reduce){.dsm-toast{animation:none}.dsm-spin{animation:none}}

/* ---- Jira tab --------------------------------------------------------- */
.jira-tabbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:2px 0 0}
.jira-tabbar .jira-tabs{display:flex;flex-wrap:wrap;gap:3px;padding:3px;border-radius:13px;background:var(--dsm-hover)}
.jira-tabbar .jira-tab{border:0;background:transparent;font:inherit;font-size:12.5px;font-weight:600;
  color:var(--dsm-ink-3);padding:7px 16px;border-radius:10px;cursor:pointer;
  display:inline-flex;align-items:center;gap:7px;transition:color .18s,background .18s,box-shadow .18s}
.jira-tabbar .jira-tab:hover{color:var(--dsm-ink)}
.jira-tabbar .jira-tab-on{color:var(--dsm-ink);background:var(--dsm-card-bg);
  box-shadow:0 1px 0 var(--dsm-sheen) inset,0 2px 10px -5px rgba(15,23,42,.5)}
.jira-tabbar .dsm-badge{max-width:none;margin-left:4px}
.jira-sprintline{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 18px;border-radius:16px;
  border:1px solid var(--dsm-card-border);background:var(--dsm-card-bg);backdrop-filter:blur(18px) saturate(160%);
  box-shadow:var(--dsm-card-shadow);position:relative;overflow:hidden}
.jira-sprintline::after{content:"";position:absolute;inset:-140% auto auto -6%;width:340px;height:200px;border-radius:50%;
  background:radial-gradient(circle at 50% 50%, #2684ff, transparent 70%);opacity:.16;filter:blur(30px);pointer-events:none}
body[data-ds-dark-theme] .jira-sprintline::after{opacity:.24}
.jira-sprintline-label{font-size:11px;color:var(--dsm-ink-3);white-space:nowrap;font-variant-numeric:tabular-nums}
.jira-sprintline-label b{color:var(--dsm-ink);font-weight:660}
.jira-sprintline-track{flex:1;min-width:120px;height:7px;border-radius:99px;background:var(--dsm-track);overflow:hidden}
.jira-sprintline-track i{display:block;height:100%;border-radius:99px;
  background:linear-gradient(90deg,#38bdf8,#2684ff 60%,#6366f1);box-shadow:0 0 14px -2px #2684ff;
  transition:width 700ms cubic-bezier(.22,1,.36,1)}
.jira-sprintline-pct{font-size:12px;font-weight:660;font-variant-numeric:tabular-nums;white-space:nowrap}
.jira-sprintline-sep{width:1px;align-self:stretch;background:var(--dsm-hair)}
.jira-sprintline-fig{display:flex;align-items:baseline;gap:6px;font-size:11px;white-space:nowrap}
.jira-sprintline-fig em{font-style:normal;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--dsm-ink-3)}
.jira-sprintline-fig b{font-size:13px;font-weight:650;font-variant-numeric:tabular-nums}
.jira-sprintline .jira-open{margin-left:auto;border:1px solid var(--dsm-card-border);background:var(--dsm-hover);
  color:var(--dsm-ink-2);font-size:11.5px;font-weight:620;padding:6px 11px;border-radius:9px;text-decoration:none;white-space:nowrap}
.jira-sprintline .jira-open:hover{color:var(--dsm-ink)}
.jira-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
.jira-kpi{padding:13px 14px;border-radius:16px;border:1px solid var(--dsm-card-border);background:var(--dsm-card-bg);
  backdrop-filter:blur(18px) saturate(160%);box-shadow:var(--dsm-card-shadow);position:relative;overflow:hidden}
.jira-kpi span{display:block;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsm-ink-3);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jira-kpi strong{display:block;margin-top:4px;font-size:24px;font-weight:670;letter-spacing:-.03em;
  font-variant-numeric:tabular-nums;line-height:1}
.jira-kpi small strong,.jira-kpi-strong-sm{font-size:15px}
.jira-kpi i{position:absolute;inset:auto auto 0 0;height:2px;width:100%;opacity:.9}
.jira-kpi-todo i{background:#64748b}.jira-kpi-progress i{background:#38bdf8}
.jira-kpi-review i{background:#a78bfa}.jira-kpi-blocked i{background:#ef4444}
.jira-kpi-done i{background:#10b981}.jira-kpi-late i{background:#f59e0b}
.jira-grid{display:grid;grid-template-columns:minmax(0,2.15fr) minmax(0,1fr);gap:16px;align-items:start}
@media (max-width:1180px){.jira-grid{grid-template-columns:minmax(0,1fr)}}
.jira-col{display:flex;flex-direction:column;gap:16px;min-width:0}
.jira-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.jira-filters{display:flex;gap:3px;padding:3px;border-radius:10px;background:var(--dsm-hover);flex-wrap:wrap}
.jira-filters button{border:0;background:transparent;font:inherit;font-size:11px;font-weight:600;color:var(--dsm-ink-3);
  padding:5px 10px;border-radius:8px;cursor:pointer}
.jira-filters button:hover{color:var(--dsm-ink)}
.jira-filters button.on{color:var(--dsm-ink);background:var(--dsm-card-bg);box-shadow:0 1px 0 var(--dsm-sheen) inset}
.jira-search{margin-left:auto;display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:9px;
  border:1px solid var(--dsm-hair);background:var(--dsm-hover);color:var(--dsm-ink-3);font-size:11px}
.jira-issues{width:100%;border-collapse:collapse;font-size:11.5px}
.jira-issues th{text-align:left;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--dsm-ink-3);
  font-weight:640;padding:0 9px 8px 0;border-bottom:1px solid var(--dsm-hair);white-space:nowrap}
.jira-issues td{padding:8px 9px 8px 0;border-bottom:1px solid var(--dsm-hair);vertical-align:middle}
.jira-issues tr:last-child td{border-bottom:0}
.jira-issues tbody tr{transition:background .15s}
.jira-issues tbody tr:hover{background:var(--dsm-hover)}
.jira-key-cell{white-space:nowrap}
.jira-type{display:inline-flex;vertical-align:-2px;margin-right:6px}
.jira-type-bug{color:#ef4444}.jira-type-story{color:#10b981}.jira-type-task{color:#38bdf8}
.jira-key{font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:10.5px;font-weight:600;color:var(--dsm-ink-2)}
.jira-summary-cell{min-width:180px;max-width:420px}
.jira-summary{display:block;font-weight:560;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jira-epic{display:block;margin-top:2px;font-size:9.5px;color:var(--dsm-ink-3)}
.jira-status{font-size:10px;font-weight:640;padding:2.5px 8px;border-radius:99px;white-space:nowrap;display:inline-block}
.jira-status-todo{color:var(--dsm-ink-2);background:var(--dsm-hover)}
.jira-status-progress{color:#38bdf8;background:rgba(56,189,248,.14)}
.jira-status-review{color:#a78bfa;background:rgba(167,139,250,.14)}
.jira-status-blocked{color:#ef4444;background:rgba(239,68,68,.13)}
.jira-status-done{color:#10b981;background:rgba(16,185,129,.13)}
.jira-prio{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;white-space:nowrap;color:var(--dsm-ink-2)}
.jira-prio i{width:7px;height:7px;border-radius:2px;flex:none}
.jira-av{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;
  font-size:9px;font-weight:700;letter-spacing:.02em;color:#fff;flex:none;
  background:linear-gradient(140deg,var(--av,#64748b),color-mix(in srgb, var(--av,#64748b) 55%, #0f172a))}
.jira-av-empty{background:var(--dsm-track);color:var(--dsm-ink-3)}
.jira-due{font-size:10.5px;color:var(--dsm-ink-3);white-space:nowrap;font-variant-numeric:tabular-nums}
.jira-due.late{color:#ef4444;font-weight:640}
.jira-due.soon{color:#f59e0b}
.jira-points{font-size:10.5px;color:var(--dsm-ink-3);text-align:right;font-variant-numeric:tabular-nums}
.jira-row-actions{text-align:right;white-space:nowrap}
.jira-move{position:relative;display:inline-flex;gap:4px}
.jira-menu{position:absolute;top:calc(100% + 6px);right:0;z-index:20;min-width:168px;padding:6px;
  border-radius:11px;border:1px solid var(--dsm-card-border);background:var(--dsw-alias-bg-layer-2, #fff);
  box-shadow:0 20px 44px -22px rgba(15,23,42,.75);display:flex;flex-direction:column;gap:2px}
body[data-ds-dark-theme] .jira-menu{background:#151a23}
.jira-menu-title{font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:var(--dsm-ink-3);padding:4px 8px 6px}
.jira-menu-empty{padding:6px 8px;font-size:11px;color:var(--dsm-ink-3)}
.jira-menu-item{display:flex;align-items:center;gap:8px;border:0;background:transparent;font:inherit;font-size:11.5px;
  color:var(--dsm-ink-2);padding:6px 8px;border-radius:7px;cursor:pointer;text-align:left;width:100%}
.jira-menu-item:hover{background:var(--dsm-hover);color:var(--dsm-ink)}
.jira-menu-dot{width:7px;height:7px;border-radius:2px;flex:none;background:#64748b}
.jira-menu-progress{background:#38bdf8}.jira-menu-review{background:#a78bfa}.jira-menu-done{background:#10b981}
.jira-prios{display:flex;flex-direction:column;gap:9px}
.jira-prio-row{display:grid;grid-template-columns:64px minmax(0,1fr) 30px;align-items:center;gap:9px;font-size:10.5px}
.jira-prio-label{color:var(--dsm-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jira-prio-track{height:5px;border-radius:99px;background:var(--dsm-track);overflow:hidden}
.jira-prio-track i{display:block;height:100%;border-radius:99px;transition:width 600ms cubic-bezier(.22,1,.36,1)}
.jira-prio-row b{text-align:right;font-variant-numeric:tabular-nums;font-weight:640;font-size:10.5px}
.jira-watch{display:flex;flex-direction:column;gap:8px}
.jira-watch-row{display:flex;flex-direction:column;gap:3px;padding:9px 11px;border-radius:11px;text-decoration:none;
  background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.18)}
.jira-watch-row:hover{border-color:rgba(239,68,68,.34)}
.jira-watch-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.jira-watch-flag{font-size:9.5px;color:#ef4444;font-weight:640;white-space:nowrap}
.jira-watch-flag.is-blocked{color:#ef4444}
.jira-watch-text{font-size:10.5px;color:var(--dsm-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jira-setup{padding:20px 22px;display:flex;flex-direction:column;gap:12px}
.jira-missing{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.jira-missing li{display:flex;align-items:center;gap:10px;font-size:11.5px;color:var(--dsm-ink-2)}
.jira-missing code{font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:10.5px;font-weight:600;
  padding:3px 7px;border-radius:6px;background:var(--dsm-hover);color:#38bdf8;min-width:150px}
.jira-error{color:#ef4444}
@media (max-width:1100px){.jira-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:760px){.jira-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  .jira-sprintline-sep,.jira-sprintline-fig:nth-of-type(n+4){display:none}}
.jira-summary-btn{border:0;background:transparent;padding:0;margin:0;font:inherit;color:inherit;text-align:left;
  cursor:pointer;width:100%;display:block;border-radius:6px}
.jira-summary-btn:hover .jira-summary{color:#60a5fa}
.jira-issue-row{cursor:pointer}
.dsm-log{margin:0;padding:12px 14px;border-radius:11px;background:var(--dsm-hover);border:1px solid var(--dsm-hair);
  font-family:var(--dsw-font-family-code, ui-monospace, monospace);font-size:10.5px;line-height:1.55;
  color:var(--dsm-ink-2);white-space:pre-wrap;word-break:break-word;overflow:auto;max-height:100%}
.jira-issue-row:hover .jira-key{color:var(--dsm-ink)}
.jira-summary-btn:focus-visible{outline:2px solid #2684ff;outline-offset:2px}
.jira-overlay{position:fixed;inset:0;z-index:70}
.jira-scrim{position:absolute;inset:0;background:rgba(6,8,13,.66)}
.jira-drawer{position:absolute;top:0;right:0;bottom:0;width:min(520px,92vw);background:#fbfcfe;
  border-left:1px solid var(--dsm-card-border);box-shadow:-30px 0 80px -40px rgba(0,0,0,.85);
  display:flex;flex-direction:column;overflow:hidden}
body[data-ds-dark-theme] .jira-drawer{background:#0d1017}
.jira-drawer-head{padding:16px 20px 14px;border-bottom:1px solid var(--dsm-hair);display:flex;flex-direction:column;gap:9px}
.jira-drawer-crumb{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--dsm-ink-3);flex-wrap:wrap}
.jira-drawer-title{margin:0;font-size:17px;font-weight:660;line-height:1.3;letter-spacing:-.015em}
.jira-drawer-muted{font-size:11px;color:var(--dsm-ink-3)}
.jira-drawer-tags{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.jira-drawer-spacer{flex:1}
.jira-drawer-close{margin-left:auto;border:1px solid var(--dsm-card-border);background:var(--dsm-hover);
  color:var(--dsm-ink-2);width:26px;height:26px;border-radius:8px;cursor:pointer;font-size:15px;line-height:1}
.jira-drawer-close:hover{color:var(--dsm-ink)}
.jira-drawer-body{padding:16px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;flex:1}
.jira-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 18px}
.jira-field span{display:block;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsm-ink-3)}
.jira-field strong{display:block;margin-top:3px;font-size:12px;font-weight:600;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.jira-section-title{margin:0 0 7px;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;
  color:var(--dsm-ink-3);font-weight:640}
.jira-desc{margin:0;font-size:11.5px;line-height:1.55;color:var(--dsm-ink-2);white-space:pre-wrap}
.jira-subtasks{display:flex;align-items:center;gap:10px}
.jira-subtasks .jira-prio-track{flex:1}
.jira-comment{display:grid;grid-template-columns:22px minmax(0,1fr);gap:9px;padding:9px 0;border-top:1px solid var(--dsm-hair)}
.jira-comment:first-of-type{border-top:0}
.jira-comment-who{font-size:10.5px;font-weight:640}
.jira-comment-at{font-size:9.5px;color:var(--dsm-ink-3);margin-left:6px;font-weight:400}
.jira-comment-text{margin:2px 0 0;font-size:11px;color:var(--dsm-ink-2);line-height:1.5;white-space:pre-wrap}
.jira-drawer-foot{display:flex;gap:8px;padding:13px 20px;border-top:1px solid var(--dsm-hair);
  background:var(--dsm-hover);flex-wrap:wrap}
.jira-btn{font:inherit;font-size:11.5px;font-weight:620;padding:8px 14px;border-radius:9px;cursor:pointer;
  border:1px solid var(--dsm-card-border);background:var(--dsm-card-bg);color:var(--dsm-ink-2);text-decoration:none}
.jira-btn:hover{color:var(--dsm-ink)}
.jira-btn-primary{border-color:transparent;color:#fff;background:linear-gradient(135deg,#2684ff,#0052cc);
  box-shadow:0 10px 26px -16px rgba(38,132,255,.9)}
.jira-btn-primary:disabled{opacity:.6;cursor:progress}
.jira-btn-ghost{margin-left:auto;background:transparent}
@media (prefers-reduced-motion:reduce){.jira-drawer,.jira-scrim{transition:none}}

/* ---- watch tabs ------------------------------------------------------- */
.news-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:16px}
.news-card{display:flex;flex-direction:column;border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;
  border:1px solid var(--dsm-card-border);background:var(--dsm-card-bg);box-shadow:var(--dsm-card-shadow);
  transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s,border-color .3s}
.news-card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,#60a5fa 36%,transparent);
  box-shadow:0 26px 54px -34px rgba(15,23,42,.85)}
.news-media{position:relative;aspect-ratio:16/9;overflow:hidden;display:grid;place-items:center}
.news-media img{width:100%;height:100%;object-fit:cover;display:block}
.news-initial{font-size:20px;font-weight:700;letter-spacing:.08em;color:rgba(255,255,255,.5);text-transform:uppercase}
.news-source{position:absolute;left:10px;top:10px;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:#fff;background:rgba(8,10,16,.55);backdrop-filter:blur(8px);padding:3px 8px;border-radius:99px}
.news-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:7px;flex:1}
.news-title{font-size:12.5px;font-weight:640;line-height:1.42;letter-spacing:-.005em;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.news-summary{font-size:11px;line-height:1.45;color:var(--dsm-ink-3);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.news-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;font-size:9.5px;color:var(--dsm-ink-3);
  font-variant-numeric:tabular-nums}
.news-tag{background:var(--dsm-hover);border-radius:5px;padding:1px 5px}
.news-row{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:10px;text-decoration:none;
  background:var(--dsm-hover);border:1px solid var(--dsm-hair)}
.news-row:hover{border-color:var(--dsm-card-border)}
.news-row-title{font-size:11px;font-weight:560;color:var(--dsm-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.news-row-meta{font-size:9.5px;color:var(--dsm-ink-3)}
.dsm-loading{display:flex;align-items:center;gap:10px;padding:26px 4px;color:var(--dsm-ink-3);font-size:12px}
/* anchors reusing table text must not inherit the browser link colour */
a.jira-summary,a.news-row-title{color:inherit;text-decoration:none}
a.jira-summary:hover,a.news-row-title:hover{color:#60a5fa;text-decoration:underline}
.dsm-badge-alert{color:#fff;background:#ef4444}
.dsm-toast-warn{color:#f59e0b}

/* ---- to-do tab -------------------------------------------------------- */
.dsm-todo-add{padding:14px 16px}
.dsm-todo-form{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dsm-todo-input{flex:1;min-width:220px;font:inherit;font-size:12.5px;color:var(--dsm-ink);
  background:var(--dsm-hover);border:1px solid var(--dsm-hair);border-radius:10px;padding:9px 12px;outline:none}
.dsm-todo-input:focus{border-color:color-mix(in srgb,#6366f1 55%,transparent);
  box-shadow:0 0 0 3px color-mix(in srgb,#6366f1 18%,transparent)}
.dsm-todo-input::placeholder{color:var(--dsm-ink-3)}
.dsm-todo-date,.dsm-todo-prio{font:inherit;font-size:11.5px;color:var(--dsm-ink-2);background:var(--dsm-hover);
  border:1px solid var(--dsm-hair);border-radius:10px;padding:8px 10px;cursor:pointer}
.dsm-todo-submit{font:inherit;font-size:12px;font-weight:640;color:#fff;border:0;border-radius:10px;cursor:pointer;
  padding:9px 18px;background:linear-gradient(135deg,#6366f1,#22d3ee);box-shadow:0 12px 28px -18px #6366f1}
.dsm-todo-submit:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}
.dsm-todo-list{display:flex;flex-direction:column;gap:2px}
.dsm-todo{display:grid;grid-template-columns:22px minmax(0,1fr) 28px;align-items:center;gap:10px;
  padding:9px 8px;border-radius:10px;transition:background .15s}
.dsm-todo:hover{background:var(--dsm-hover)}
.dsm-todo.is-done .dsm-todo-text{text-decoration:line-through;color:var(--dsm-ink-3)}
.dsm-todo-check{width:16px;height:16px;accent-color:#6366f1;cursor:pointer}
.dsm-todo-body{display:flex;flex-direction:column;gap:3px;min-width:0}
.dsm-todo-text{font-size:12.5px;font-weight:560;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-todo-meta{display:flex;align-items:center;gap:9px;font-size:9.5px;color:var(--dsm-ink-3);flex-wrap:wrap}
.dsm-todo-due{font-variant-numeric:tabular-nums}
.dsm-todo-due.is-late{color:#ef4444;font-weight:640}
.dsm-todo-due.is-today{color:#f59e0b;font-weight:640}
.dsm-todo-prio-tag{border-radius:5px;padding:1px 6px;font-weight:640}
.dsm-todo-prio-tag.is-high{color:#ef4444;background:rgba(239,68,68,.12)}
.dsm-todo-prio-tag.is-low{color:var(--dsm-ink-3);background:var(--dsm-hover)}
.dsm-todo-foot{display:flex;justify-content:flex-end;padding-top:12px;border-top:1px solid var(--dsm-hair)}
`;

    /* --------------------------------------------------------------- mount */

    /**
     * Client plugin body.
     *
     * `locale` is a declared injection, not an optional service: this plugin
     * registers dictionaries and binds `t` while applying, so without the
     * declaration the fiber could activate before the locale service exists and
     * fail the whole web boot.
     */
    function register(ctx) {
      const dictionaries = { en, fr };
      ctx.effect(() => ctx.locale.register(NS, dictionaries), 'system-monitor: dictionaries');
      const t = ctx.locale.bind(NS);

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            // `locale` is what binds `t` into the slot props; injecting `t`
            // again would collide with the renderer's duplicate-prop guard.
            locale: NS,
          },
          (props) => h(PanelBoundary, { t: props?.t ?? t }, h(SystemPage, props)),
        ),
      );

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 20,
            locale: NS,
            label: () => t('panel'),
          },
          PanelIcon,
        ),
      );
    }

    /**
     * A client plugin that throws leaves its fiber FAILED and fails the whole
     * web boot, so one broken registration must never take the app down: log it
     * at error level (the diagnostics log keeps renderer errors) and stay active.
     */
    function apply(ctx) {
      try {
        register(ctx);
      } catch (error) {
        console.error('[system-monitor] activation failed', error);
      }
    }

    /** Required client services; `locale` is used during activation, not later. */
    const inject = ['slots', 'locale'];

    // The offline render harness (tools/render.mjs) sets this flag to reach the
    // view without the kernel; the module contract stays `{ inject, apply }`.
    if (typeof globalThis !== 'undefined' && globalThis.__DSM_TEST__ === true) {
      return { inject, apply, __view: DashboardView, __icon: PanelIcon };
    }
    return { inject, apply };
  },
});
