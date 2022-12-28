import logo from './logo.svg'
import './App.css'
// import Cytoscape from './component/Cytoscape';
import cytoscape from 'cytoscape'
import { useRef, useEffect, useState } from 'react'
import { Client } from '@notionhq/client'
import axios from 'axios'
import coseBilkent from 'cytoscape-cose-bilkent'
// import { dummyEdges } from './dummyEdges'
import localEdgeData from './temp.json'

const NOTION_API_KEY = process.env.REACT_APP_NOTION_API_KEY
const DB_ID = process.env.REACT_APP_NOTION_DATABASE_ID

axios.defaults.headers.common['Authorization'] = `Bearer ${NOTION_API_KEY}`
axios.defaults.headers.common['Notion-Version'] = '2022-06-28'
axios.defaults.headers.common['Content-Type'] = 'application/json'

cytoscape.use(coseBilkent)

function App() {
  const containerRef = useRef()
  const [data, setData] = useState('')

  const fetchCompany = async () => {
    const res = await axios.post('/v1/databases/' + DB_ID + '/query', {
      sorts: [
        {
          property: 'company',
          direction: 'ascending',
        },
      ],
    })

    let temp = res.data.results
    // console.log('temp', temp)
    let more_flag = res.data.has_more

    while (more_flag) {
      const new_res = await axios.post('/v1/databases/' + DB_ID + '/query', {
        sorts: [
          {
            property: 'company',
            direction: 'ascending',
          },
        ],
        start_cursor: res.data.next_cursor,
      })

      temp = temp.concat(new_res.data.results)
      more_flag = new_res.data.has_more
    }

    // console.log('final', temp)

    const nodes = []

    for (const comp of temp) {
      JSON.stringify(comp)
      const company_code = comp.properties.code.rich_text[0].plain_text
      const company_name = comp.properties.company.title[0].plain_text
      const company_trend = comp.properties.trend.number
      const company_sector = comp.properties.sector.select.name

      let company_nodeColor
      switch (company_sector) {
        case 'KRX 건설':
          company_nodeColor = '#1abc9c'
          break
        case 'KRX 보험':
          company_nodeColor = '#2ecc71'
          break
        case 'KRX 화학':
          company_nodeColor = '#3498db'
          break
        case 'KRX 정보기술':
          company_nodeColor = '#9b59b6'
          break
        case 'KRX 필수소비재':
          company_nodeColor = '#34495e'
          break
        case 'KRX 헬스케어':
          company_nodeColor = '#f1c40f'
          break
        case 'KRX 방송통신':
          company_nodeColor = '#e74c3c'
          break
        case 'KRX 철강':
          company_nodeColor = '#d35400'
          break
        case 'KRX 증권':
          company_nodeColor = '#540375'
          break
        case 'KRX 자동차':
          company_nodeColor = '#FF7000'
          break
        case 'KRX 경기소비재':
          company_nodeColor = '#FD8A8A'
          break
        case 'KRX 기계장비':
          company_nodeColor = '#FFBF00'
          break
        case 'KRX 은행':
          company_nodeColor = '#E14D2A'
          break
        case 'KRX 운송':
          company_nodeColor = '#FD841F'
          break
        case 'KRX 미디어&엔터테인먼트':
          company_nodeColor = '#3E6D9C'
          break
        case 'KRX 유틸리티':
          company_nodeColor = '#001253'
          break
        case 'KRX 반도체':
          company_nodeColor = '#FD8A8A'
          break
        case '보안':
          company_nodeColor = '#FD8A8A'
          break
        case '지주':
          company_nodeColor = '#FD8A8A'
          break
        case '방산':
          company_nodeColor = '#FD8A8A'
          break
        default:
          company_nodeColor = '#57606f'
          break
      }
      const node = {
        data: {
          id: company_code,
          label: company_name,
          trend: company_trend,
          sector: company_sector,
          color: company_nodeColor,
        },
      }
      nodes.push(node)
    }

    // console.log(nodes)

    const edges = []

    // edges
    // 일단 랜덤하게 연결함
    // let edge_id = 0
    // for (let i = 0; i < 200; i++) {
    //   let edge_num_rand = Math.floor(Math.random() * 1) + 1
    //   for (let j = 0; j < edge_num_rand; j++) {
    //     let rand = Math.floor(Math.random() * 200)
    //     const edge = {
    //       data: {
    //         id: `e${edge_id++}`,
    //         source: temp[i].properties.code.rich_text[0].plain_text,
    //         target: temp[rand].properties.code.rich_text[0].plain_text,
    //       },
    //     }
    //     edges.push(edge)
    //   }
    // }

    // console.log(edges)

    const nodes_temp = {
      nodes: nodes,
      edges: localEdgeData, // 로컬 데이터
    }

    // console.log('nodes_temp', nodes_temp)
    setData(nodes_temp)
  }

  useEffect(() => {
    fetchCompany()
  }, [])

  useEffect(() => {
    // node & font 크기 값
    const nodeMaxSize = 50
    const nodeMinSize = 5
    const nodeActiveSize = 28
    const fontMaxSize = 8
    const fontMinSize = 10
    const fontActiveSize = 7

    // edge & arrow 크기값
    const edgeWidth = '2px'
    var edgeActiveWidth = '4px'
    const arrowScale = 0.8
    const arrowActiveScale = 1.2

    const dimColor = '#dfe4ea'
    // const edgeColor = '#ced6e0'
    const edgeColor = '#ffffff'
    const nodeColor = '#57606f'
    const nodeActiveColor = '#ffa502'

    // 상위 node & edge color
    const successorColor = '#ff6348'
    // 하위 node & edge color
    const predecessorsColor = '#1e90ff'

    function setDimStyle(target_cy, style) {
      target_cy.nodes().forEach(function (target) {
        target.style(style)
      })
      target_cy.edges().forEach(function (target) {
        target.style(style)
      })
    }

    function setFocus(
      target_element,
      successorColor,
      predecessorsColor,
      edgeWidth,
      arrowScale
    ) {
      target_element.style('background-color', nodeActiveColor)
      target_element.style('color', nodeColor)
      target_element.successors().each(function (e) {
        // 상위  엣지와 노드
        if (e.isEdge()) {
          // e.style('width', edgeWidth)
          e.style('arrow-scale', arrowScale)
        }
        e.style('color', nodeColor)
        // e.style('background-color', successorColor)
        e.style('background-color', e.data('color'))
        e.style('line-color', successorColor)
        e.style('source-arrow-color', successorColor)
        setOpacityElement(e, 0.5)
      })
      target_element.predecessors().each(function (e) {
        // 하위 엣지와 노드
        if (e.isEdge()) {
          // e.style('width', edgeWidth)
          e.style('arrow-scale', arrowScale)
        }
        e.style('color', nodeColor)
        // e.style('background-color', predecessorsColor)
        e.style('background-color', e.data('color'))
        e.style('line-color', predecessorsColor)
        e.style('source-arrow-color', predecessorsColor)
        setOpacityElement(e, 0.5)
      })

      // 이웃한 엣지와 노드
      target_element.neighborhood().each(function (e) {
        setOpacityElement(e, 1)
      })
    }

    function setOpacityElement(target_element, degree) {
      target_element.style('opacity', degree)
    }

    function setResetFocus(target_cy) {
      target_cy.nodes().forEach(function (target) {
        target.style('background-color', nodeColor)
        target.style('color', nodeColor)
        target.style('opacity', 1)
      })
      target_cy.edges().forEach(function (target) {
        target.style('line-color', edgeColor)
        target.style('source-arrow-color', edgeColor)
        // target.style('width', edgeWidth)
        target.style('arrow-scale', arrowScale)
        target.style('opacity', 1)
      })
    }

    const config = {
      container: containerRef.current,
      elements: data,
      style: [
        {
          selector: 'node',
          style: {
            // 노드 라벨 컬러
            color: '#666',
            // 노드 색
            'background-color': '#666',
            // color: function (ele) {
            //   return ele.data('color')
            // },
            // 'background-color': function (ele) {
            //   return ele.data('color')
            // },
            label: 'data(label)',
            width: function (ele) {
              // return nodeMaxSize * pageRank.rank('#' + ele.id()) + nodeMinSize
              return nodeMinSize + ele.data('trend') * 10
            },
            height: function (ele) {
              // return nodeMaxSize * pageRank.rank('#' + ele.id()) + nodeMinSize
              return nodeMinSize + ele.data('trend') * 10
            },
            'font-size': function (ele) {
              // return fontMaxSize * pageRank.rank('#' + ele.id()) + fontMinSize
              return fontMinSize + ele.data('trend') * 5
            },
            padding: 3,
          },
        },
        {
          selector: 'edge',
          style: {
            // width: 3,
            width: function (ele) {
              // return nodeMaxSize * pageRank.rank('#' + ele.id()) + nodeMinSize

              const edgeWidth = ele.data('width')

              if (edgeWidth < 10) {
                return 0.5
              } else if (edgeWidth < 40) {
                return 2
              } else if (edgeWidth < 60) {
                return 4
              } else if (edgeWidth < 100) {
                return 6
              } else return 8
            },
          },
        },
      ],
      layout: {
        name: 'cose-bilkent',
        animate: false,
        gravityRangeCompound: 1.5,
        fit: true,
        tile: true,
      },

      // initial viewport state:
      zoom: 1,
      pan: { x: 0, y: 0 },

      // interaction options:
      minZoom: 1e-50,
      maxZoom: 1e50,
      zoomingEnabled: true,
      userZoomingEnabled: true,
      panningEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'single',
      touchTapThreshold: 8,
      desktopTapThreshold: 4,
      autolock: false,
      autoungrabify: false,
      autounselectify: false,
      multiClickDebounceTime: 250,

      // rendering options:
      headless: false,
      styleEnabled: true,
      hideEdgesOnViewport: false,
      textureOnViewport: false,
      motionBlur: false,
      motionBlurOpacity: 0.2,
      wheelSensitivity: 1,
      pixelRatio: 'auto',
    }

    const cy = cytoscape(config)

    cy.layout({ name: 'cose-bilkent', fit: true, padding: 20 })

    cy.on('tapstart mouseover', 'node', function (e) {
      setDimStyle(cy, {
        'background-color': dimColor,
        'line-color': dimColor,
        'source-arrow-color': dimColor,
        color: dimColor,
      })

      setFocus(
        e.target,
        successorColor,
        predecessorsColor,
        edgeActiveWidth,
        arrowActiveScale
      )
    })

    cy.on('tapend mouseout', 'node', function (e) {
      setResetFocus(e.cy)
    })

    let resizeTimer

    window.addEventListener('resize', function () {
      this.clearTimeout(resizeTimer)
      resizeTimer = this.setTimeout(function () {
        cy.fit()
      }, 200)
    })
  }, [data])

  return (
    <div>
      <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
    </div>
  )
}

export default App
