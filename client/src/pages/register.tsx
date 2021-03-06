import { Form, Formik } from "formik";
import { Box, Button, useToast } from "@chakra-ui/react";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { MeDocument, MeQuery, useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withApollo } from "../utils/withApollo";
import { sleep } from "../utils/sleep";
interface registerProps {}

export const Register: React.FC<registerProps> = ({}) => {
  const [register] = useRegisterMutation();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Wrapper varitant="small">
        <Box
          p={8}
          maxWidth="500px"
          borderWidth={1}
          borderRadius={8}
          boxShadow="lg"
        >
          <Formik
            initialValues={{ email: "", username: "", password: "" }}
            onSubmit={async (values, { setErrors }) => {
              const response = await register({
                variables: { options: values },
                update: (cache, { data }) => {
                  cache.writeQuery<MeQuery>({
                    query: MeDocument,
                    data: {
                      __typename: "Query",
                      me: data?.register.user,
                    },
                  });
                },
              });
              if (response.data?.register.errors) {
                setErrors(toErrorMap(response.data.register.errors));
              } else if (response.data?.register.user) {
                toast({
                  title: "Register Successful.",
                  description: "Registered Successfully.",
                  status: "success",
                  duration: 5000,
                  variant: "top-accent",
                  isClosable: true,
                });
                sleep(100);
                // worked
                router.push("/");
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form>
                <InputField
                  name="Username"
                  placeholder="Username"
                  label="Username"
                />
                <Box mt={4}>
                  <InputField name="email" placeholder="email" label="Email" />
                </Box>
                <Box mt={4}>
                  <InputField
                    name="Password"
                    placeholder="Password"
                    label="Password"
                    type="password"
                  />
                </Box>
                <Button
                  mt={4}
                  type="submit"
                  isLoading={isSubmitting}
                  variantColor="teal"
                  width="full"
                >
                  Register
                </Button>
              </Form>
            )}
          </Formik>
        </Box>
      </Wrapper>
    </>
  );
};

export default withApollo({ ssr: false })(Register);
