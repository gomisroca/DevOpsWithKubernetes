package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"k8s.io/apimachinery/pkg/util/intstr"

	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/dynamicinformer"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {
    log.Println("Starting DummySite Controller...")

    config, err := loadKubeConfig()
    if err != nil {
        log.Fatal("Failed to load kubeconfig:", err)
    }

    dyn, err := dynamic.NewForConfig(config)
    if err != nil {
        log.Fatal(err)
    }

    gvr := schema.GroupVersionResource{
        Group:    "example.com",
        Version:  "v1",
        Resource: "dummysites",
    }

    factory := dynamicinformer.NewDynamicSharedInformerFactory(dyn, 0)
    informer := factory.ForResource(gvr).Informer()

    informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
        AddFunc: func(obj interface{}) {
            u := obj.(*unstructured.Unstructured)
            name := u.GetName()
            ns := u.GetNamespace()

            spec, ok := u.Object["spec"].(map[string]interface{})
            if !ok {
                log.Println("Spec missing in DummySite")
                return
            }

            rawURL, ok := spec["website_url"]
            if !ok {
                log.Println("website_url missing")
                return
            }

            websiteURL := rawURL.(string)
            go handleDummySite(dyn, ns, name, websiteURL)
        },
    })

    stop := make(chan struct{})
    informer.Run(stop)
}

func handleDummySite(dyn dynamic.Interface, ns, name, websiteURL string) {
    log.Printf("Processing DummySite %s/%s from URL: %s\n", ns, name, websiteURL)

    resp, err := http.Get(websiteURL)
    if err != nil {
        log.Println("Failed to fetch:", err)
        return
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        log.Println("Failed reading body:", err)
        return
    }

    cm := &corev1.ConfigMap{
        TypeMeta: metav1.TypeMeta{
            APIVersion: "v1",
            Kind:       "ConfigMap",
        },
        ObjectMeta: metav1.ObjectMeta{
            Name:      name + "-html",
            Namespace: ns,
        },
        Data: map[string]string{
            "index.html": string(body),
        },
    }

    if err := applyConfigMap(dyn, cm); err != nil {
        log.Println(err)
        return
    }

    deploy := generateDeployment(name, ns, cm.Name)

    if err := applyDeployment(dyn, deploy); err != nil {
        log.Println(err)
        return
    }

    svc := generateService(name, ns)

    if err := applyService(dyn, svc); err != nil {
        log.Println(err)
        return
    }

    log.Printf("DummySite %s/%s created successfully\n", ns, name)
}

func applyConfigMap(dyn dynamic.Interface, cm *corev1.ConfigMap) error {
    gvr := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "configmaps"}

    obj, err := toUnstructured(cm)
    if err != nil {
        return err
    }

    _, err = dyn.Resource(gvr).Namespace(cm.Namespace).Create(context.Background(), obj, metav1.CreateOptions{})
    if err != nil {
        return fmt.Errorf("Failed to create ConfigMap: %w", err)
    }
    return nil
}

func applyDeployment(dyn dynamic.Interface, d *appsv1.Deployment) error {
    gvr := schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}

    obj, err := toUnstructured(d)
    if err != nil {
        return err
    }
    _, err = dyn.Resource(gvr).Namespace(d.Namespace).Create(context.Background(), obj, metav1.CreateOptions{})
    if err != nil {
        return fmt.Errorf("Failed to create Deployment: %w", err)
    }
    return nil
}

func applyService(dyn dynamic.Interface, svc *corev1.Service) error {
    gvr := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "services"}

    obj, err := toUnstructured(svc)
    if err != nil {
        return err
    }
    _, err = dyn.Resource(gvr).Namespace(svc.Namespace).Create(context.Background(), obj, metav1.CreateOptions{})
    if err != nil {
        return fmt.Errorf("Failed to create Service: %w", err)
    }
    return nil
}

func generateDeployment(name, ns, cm string) *appsv1.Deployment {
    replicas := int32(1)

    return &appsv1.Deployment{
        TypeMeta: metav1.TypeMeta{
            APIVersion: "apps/v1",
            Kind:       "Deployment",
        },
        ObjectMeta: metav1.ObjectMeta{
            Name:      name + "-deploy",
            Namespace: ns,
        },
        Spec: appsv1.DeploymentSpec{
            Replicas: &replicas,
            Selector: &metav1.LabelSelector{
                MatchLabels: map[string]string{"app": name},
            },
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{
                    Labels: map[string]string{"app": name},
                },
                Spec: corev1.PodSpec{
                    Containers: []corev1.Container{
                        {
                            Name:  "nginx",
                            Image: "nginx:alpine",
                            VolumeMounts: []corev1.VolumeMount{
                                {
                                    Name:      "html",
                                    MountPath: "/usr/share/nginx/html/index.html",
                                    SubPath:   "index.html",
                                },
                            },
                        },
                    },
                    Volumes: []corev1.Volume{
                        {
                            Name: "html",
                            VolumeSource: corev1.VolumeSource{
                                ConfigMap: &corev1.ConfigMapVolumeSource{
                                    LocalObjectReference: corev1.LocalObjectReference{
                                        Name: cm,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }
}

func generateService(name, ns string) *corev1.Service {
    return &corev1.Service{
        TypeMeta: metav1.TypeMeta{
            APIVersion: "v1",
            Kind:       "Service",
        },
        ObjectMeta: metav1.ObjectMeta{
            Name:      name + "-svc",
            Namespace: ns,
        },
        Spec: corev1.ServiceSpec{
            Selector: map[string]string{"app": name},
            Ports: []corev1.ServicePort{
                {
                    Port:       80,
                    TargetPort: intstr.FromInt(80),
                },
            },
        },
    }
}

func toUnstructured(obj interface{}) (*unstructured.Unstructured, error) {
    b, err := json.Marshal(obj)
    if err != nil {
        return nil, err
    }

    u := &unstructured.Unstructured{}
    if err := json.Unmarshal(b, u); err != nil {
        return nil, err
    }
    return u, nil
}

// Load in-cluster config OR fallback to local kubeconfig
func loadKubeConfig() (*rest.Config, error) {
    if c, err := rest.InClusterConfig(); err == nil {
        return c, nil
    }

    home, _ := os.UserHomeDir()
    return clientcmd.BuildConfigFromFlags("", home+"/.kube/config")
}
