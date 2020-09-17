export const UserAgents = [        'Mozilla/5.0 (Linux; Android 7.0; SM-G930VC Build/NRD90M; wv)',
'Chrome/70.0.3538.77 Safari/537.36',
'Opera/9.68 (X11; Linux i686; en-US) Presto/2.9.344 Version/11.00',
'Mozilla/5.0 (compatible; MSIE 10.0; Windows 95; Trident/5.1)',
'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_6) AppleWebKit/5342 (KHTML, like Gecko) Chrome/37.0.896.0 Mobile Safari/5342',
'Mozilla/5.0 (Windows; U; Windows NT 6.2) AppleWebKit/533.49.2 (KHTML, like Gecko) Version/5.0 Safari/533.49.2',
'Mozilla/5.0 (Windows NT 5.0; sl-SI; rv:1.9.2.20) Gecko/20110831 Firefox/37.0'];

export const getRandomUA = () => UserAgents[Math.floor(Math.random() * UserAgents.length)];