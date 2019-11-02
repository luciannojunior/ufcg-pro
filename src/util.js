const define = lib => {
  lib.ufcg = {}
  lib.ufcg.fetchAndParse = url =>
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(buffer => {
        const decoder = new TextDecoder('ISO-8859-1')
        return decoder.decode(buffer)
      })
      .then(content => {
        const parser = new DOMParser()
        return parser.parseFromString(content, 'text/html')
      })
  lib.ufcg.table2json = (table, config) => {
    const mapHeader = config.mapHeader || (input => input)
    const filterColumn = config.filterColumn || (() => true)
    const filterLine = config.filterLine || (() => true)

    const ths = table.querySelectorAll('th')
    if (!ths || (!ths.length && !config.headers)) {
      throw new Error('Please provide header values if not in the table')
    }
    const preheaders = config.headers || [...table.querySelectorAll('th')].map(th => th.innerText)
    const headers = config.firstHeader ? [config.firstHeader, ...preheaders.splice(1)] : preheaders
    const trs = table.querySelectorAll('tr')
    const entries = [...trs].splice(1)
    return entries
      .reduce((acc, current) => {
        if (!current.children) return acc
        return [
          ...acc,
          [...current.children].reduce((acc, current, index) => (filterColumn(mapHeader(headers[index])) ? { ...acc, [mapHeader(headers[index])]: current.innerText } : acc), {})
        ]
      }, [])
      .filter(filterLine)
  }

  lib.ufcg.json2Csv = (collection, separator = ';') => {
    const keys = Object.keys(collection[0])
    const header = keys.join(separator)
    const content = collection.map(entry => keys.map(key => JSON.stringify(entry[key])).join(separator))
    return [header, ...content].join('\r\n')
  }

  lib.ufcg.downloadCsv = (content, filename) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + content
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
  }

  const hoje = new Date()

  lib.ufcg.hoje = {
    periodo: hoje.getMonth() > 6 ? 2 : 1,
    ano: hoje.getFullYear()
  }

  lib.ufcg.getPaginaHorario = async () => {
    const { periodo, ano } = lib.ufcg.hoje
    // TODO: Checar se é professor e mudar a URL
    return await lib.ufcg.fetchAndParse(`/ControleAcademicoOnline/Controlador?command=AlunoHorarioConfirmar&ano=${ano}&periodo=${periodo}`)
  }
}
if (!window.ufcg) {
  define(window)
}
