import { Kbd } from "./ui/Kbd"

export function ShortcutsInfo() {
  return (
    <div className="space-y-2 p-4">
      <div>
        <p className="font-medium">On timeline</p>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>cmd</Kbd> + <Kbd>.</Kbd>
          </p>
          <p className="text-md">Create a task</p>
        </div>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>cmd</Kbd> + <Kbd>k</Kbd>
          </p>
          <p className="text-md">Enter focus mode</p>
        </div>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>cmd</Kbd> + <Kbd>b</Kbd>
          </p>
          <p className="text-md">Open backlog</p>
        </div>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>cmd</Kbd> + <Kbd>e</Kbd>
          </p>
          <p className="text-md">Open element sidebar</p>
        </div>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>cmd</Kbd> + <Kbd>\</Kbd>
          </p>
          <p className="text-md">Toggle nav</p>
        </div>
      </div>

      <hr />
      <div>
        <p className="font-medium">On a task</p>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>cmd</Kbd> + <Kbd>click</Kbd>
          </p>
          <p className="text-md">Duplicate task</p>
        </div>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>shift</Kbd> + <Kbd>click</Kbd>
          </p>
          <p className="text-md">Delete task</p>
        </div>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>alt</Kbd> + <Kbd>click</Kbd>
          </p>
          <p className="text-md">Toggle task completion</p>
        </div>
        <div className="flex items-center justify-between">
          <p>
            <Kbd>shift</Kbd> + <Kbd>cmd</Kbd> + <Kbd>click</Kbd>
          </p>
          <p className="text-md">Toggle task for bulk action</p>
        </div>
      </div>
    </div>
  )
}
