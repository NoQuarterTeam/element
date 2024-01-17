import { useRouteLoaderData } from "@remix-run/react"

import { useDisclosure } from "@element/shared"

import { RootLoader } from "~/root"
import { useFetcher } from "~/components/ui/Form"
import { Button } from "~/components/ui/Button"
import { Modal } from "~/components/ui/Modal"
import { Switch } from "~/components/ui/Switch"
import { gdprActions } from "~/services/gdpr.server"

export const action = gdprActions

export enum Actions {
  save = "save",
}
export function GDPR() {
  const { gdpr } = useRouteLoaderData("root") as RootLoader
  const acceptFetcher = useFetcher()
  const rejectFetcher = useFetcher()
  const modalFetcher = useFetcher()
  const modalProps = useDisclosure()
  if (!!gdpr) return null
  return (
    <div className="bg-background z-100 fixed bottom-0 left-0 right-0 flex flex-col items-center justify-between gap-2 border-t px-10 py-6 md:flex-row">
      <p className="max-w-4xl text-sm font-light opacity-70">
        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking
        "Accept All", you consent to our use of cookies.
      </p>
      <div className="flex items-center gap-4">
        <Button onClick={modalProps.onOpen} variant="ghost">
          Customize
        </Button>

        <acceptFetcher.Form action="/api/gdpr">
          <acceptFetcher.FormButton value={Actions.save} variant="ghost">
            Reject all
          </acceptFetcher.FormButton>
        </acceptFetcher.Form>
        <rejectFetcher.Form action="/api/gdpr">
          <input type="hidden" name="isAnalyticsEnabled" value="on" />
          <rejectFetcher.FormButton value={Actions.save}>Accept all</rejectFetcher.FormButton>
        </rejectFetcher.Form>
      </div>
      <Modal
        size="xl"
        {...modalProps}
        title="Cookie preferences"
        description="Manage your cookie settings. You can enable or disable different types of cookies below"
      >
        <modalFetcher.Form className="space-y-4" action="/api/gdpr">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <h3>Essential</h3>
              <p className="text-sm">
                Essential cookies are required for the website to function properly. This can not be disabled.
              </p>
            </div>
            <Switch checked />
          </div>
          <div className="flex items-center justify-between space-x-4">
            <div>
              <h3>Analytics</h3>
              <p className="text-sm">
                These cookies allow us to count visits and traffic sources, so we can measure and improve the performance of our
                site.
              </p>
            </div>
            <Switch name="isAnalyticsEnabled" defaultChecked />
          </div>
          <div className="flex justify-end">
            <modalFetcher.FormButton value={Actions.save}>Save</modalFetcher.FormButton>
          </div>
        </modalFetcher.Form>
      </Modal>
    </div>
  )
}
