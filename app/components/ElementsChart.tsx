import { Cell,Pie, PieChart as RChart, Tooltip } from "recharts"

interface Props {
  data: { name: string; value: number; color: string; totalMinutes: number }[]
}

export default function ElementsChart(props: Props) {
  return (
    <RChart width={500} height={500}>
      <Pie
        data={props.data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={200}
        innerRadius={110}
      >
        {props.data.map((entry, i) => (
          <Cell key={`cell-${i}`} fill={entry.color} />
        ))}
      </Pie>
      <Pie data={props.data} dataKey="totalMinutes" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
        {props.data.map((entry, i) => (
          <Cell key={`cell-${i}`} fill={entry.color} />
        ))}
      </Pie>

      <Tooltip />
    </RChart>
  )
}
